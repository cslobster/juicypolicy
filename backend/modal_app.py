"""
Modal deployment for JuicyPolicy backend + quote worker.

Setup:
    1. pip install modal
    2. modal token new
    3. modal secret create juicypolicy-env \
         DATABASE_URL="postgresql://..." \
         GEMINI_API_KEY="..." \
         WORKER_AUTH_TOKEN="..."
    4. modal deploy backend/modal_app.py

The API will be at:
    https://<username>--juicypolicy-backend-fastapi-app.modal.run
"""
from pathlib import Path
import modal

backend_dir = Path(__file__).parent
remote_path = "/root/juicypolicy-backend"

# Image for FastAPI (no browser needed)
api_image = (
    modal.Image.debian_slim()
    .pip_install_from_requirements(str(backend_dir / "requirements.txt"))
    .env({"PYTHONPATH": remote_path})
    .add_local_dir(backend_dir, remote_path=remote_path, copy=True)
)

# Image for worker (needs Playwright + Chromium)
worker_image = (
    modal.Image.debian_slim()
    .apt_install(
        "wget", "ca-certificates", "fonts-liberation",
        "libasound2", "libatk-bridge2.0-0", "libatk1.0-0",
        "libcups2", "libdbus-1-3", "libdrm2", "libgbm1",
        "libgtk-3-0", "libnspr4", "libnss3", "libx11-xcb1",
        "libxcomposite1", "libxdamage1", "libxrandr2", "xdg-utils",
    )
    .pip_install("playwright", "requests")
    .run_commands("playwright install chromium")
    .pip_install_from_requirements(str(backend_dir / "requirements.txt"))
    .env({"PYTHONPATH": remote_path})
    .add_local_dir(backend_dir, remote_path=remote_path, copy=True)
)

app = modal.App("juicypolicy-backend")
env_secret = modal.Secret.from_name("juicypolicy-env")


@app.function(image=worker_image, secrets=[env_secret], timeout=600)
def scrape_quote_task(quote_id: int, zip_code: str, income: str, ages: list[int]):
    """Modal function that scrapes CoveredCA and writes results to DB."""
    import traceback
    from playwright.sync_api import sync_playwright
    from app.database import SessionLocal
    from app import models
    from app.quote_service import convert_quote_text_to_json

    db = SessionLocal()

    def update_status(status, message):
        quote = db.query(models.Quote).filter(models.Quote.quote_id == quote_id).first()
        if quote:
            quote.quote_status = status
            quote.status_message = message
            db.commit()

    try:
        update_status("scraping", "Launching browser...")
        print(f"Processing Quote #{quote_id}: ZIP={zip_code}, Income={income}, Ages={ages}")

        with sync_playwright() as playwright:
            browser = playwright.chromium.launch(headless=True)
            context = browser.new_context()
            page = context.new_page()
            page.set_default_timeout(300000)

            update_status("scraping", "Opening CoveredCA website...")
            page.goto("https://apply.coveredca.com/lw-shopandcompare/", timeout=60000)
            page.wait_for_load_state("networkidle", timeout=60000)
            page.wait_for_timeout(2000)

            # Close popups
            try:
                close_buttons = page.locator('button[aria-label="Close"], button:has-text("Close")')
                if close_buttons.count() > 0:
                    close_buttons.first.click()
                    page.wait_for_timeout(1000)
            except:
                pass

            # Fill zip code
            update_status("scraping", f"Entering ZIP code {zip_code}...")
            try:
                zip_input = page.locator('input[placeholder*="Zip" i], input[aria-label*="Zip" i]').first
                zip_input.wait_for(state="visible", timeout=10000)
                zip_input.click()
                zip_input.fill(zip_code)
            except:
                zip_input = page.get_by_role("textbox").filter(has_text="Zip").first
                zip_input.click()
                zip_input.fill(zip_code)

            # Fill income
            update_status("scraping", f"Entering income ${income}...")
            try:
                income_input = page.locator('input[placeholder*="Income" i], input[aria-label*="Income" i]').first
                income_input.wait_for(state="visible", timeout=10000)
                income_input.click()
                income_input.fill(income)
            except:
                income_input = page.get_by_role("textbox").filter(has_text="Income").first
                income_input.click()
                income_input.fill(income)

            # Set household size
            update_status("scraping", f"Setting household size to {len(ages)}...")
            household = page.locator("#householdPeopleCount")
            household.get_by_role("combobox").click()
            household.locator('input[role="combobox"]').fill(str(len(ages)))
            household.locator('input[role="combobox"]').press("Enter")

            # Fill ages
            update_status("scraping", f"Entering ages: {ages}...")
            for index, age in enumerate(ages):
                age_input = page.locator(f"#age_hhMember_{index}")
                age_input.click()
                age_input.fill(str(age))

            # Submit form
            update_status("scraping", "Submitting form to CoveredCA...")
            result_button = page.get_by_test_id("result-button")
            result_button_handle = result_button.element_handle()
            page.wait_for_function("button => !button.disabled", arg=result_button_handle, timeout=60000)
            result_button.click()
            page.wait_for_timeout(2000)
            page.get_by_role("button", name="Continue").click()
            page.wait_for_load_state("networkidle", timeout=60000)

            # Navigate to results
            update_status("scraping", "Waiting for CoveredCA to calculate plans...")
            page.get_by_role("button", name="Preview Plans").click()
            page.wait_for_timeout(2000)
            page.get_by_role("button", name="Next").click()
            page.wait_for_timeout(2000)
            page.locator('xpath=//*[@id="root"]/div[5]/div/div/div/div[4]/div/div[2]/button').click()
            page.wait_for_timeout(2000)

            # Handle OK dialog
            try:
                ok_locator = page.locator('div[role="dialog"] button:has-text("OK")')
                ok_locator.first.wait_for(state="visible", timeout=10000)
                ok_locator.first.click(force=True)
            except:
                pass

            # Collect results
            update_status("scraping", "Collecting plan results (page 1)...")
            page.get_by_role("button", name="page 1").click()
            page.wait_for_timeout(2000)

            results_text = []
            results_locator = page.locator('xpath=//*[@id="root"]/div[6]/div[1]/ul/div/div[2]/div')
            page.wait_for_timeout(1000)
            results_text.append(results_locator.inner_text())

            page_num = 2
            while True:
                try:
                    update_status("scraping", f"Collecting plan results (page {page_num})...")
                    page.get_by_role("button", name="Go to next page").click(timeout=2000)
                    results_text.append(results_locator.inner_text())
                    page_num += 1
                except:
                    break

            context.close()
            browser.close()

            result_text = "\n\n".join(results_text)
            print(f"Scraped {len(results_text)} pages")

        # Convert with Gemini
        update_status("converting", "Parsing plan data with AI...")
        structured_data = convert_quote_text_to_json(result_text)
        structured_data["_raw_text"] = result_text
        plan_count = len(structured_data.get("plans", []))

        # Write to DB
        quote = db.query(models.Quote).filter(models.Quote.quote_id == quote_id).first()
        quote.quote_data = structured_data
        quote.has_quote = True
        quote.quote_status = "quoted"
        quote.status_message = f"Done! Found {plan_count} plans."
        db.commit()
        print(f"Quote #{quote_id}: saved {plan_count} plans")

    except Exception as e:
        print(f"Quote #{quote_id} error: {e}")
        print(traceback.format_exc())
        quote = db.query(models.Quote).filter(models.Quote.quote_id == quote_id).first()
        if quote:
            quote.quote_data = {"status": "error", "error": str(e)}
            quote.has_quote = False
            quote.quote_status = "error"
            quote.status_message = f"Error: {str(e)[:150]}"
            db.commit()
    finally:
        db.close()


@app.function(image=api_image, secrets=[env_secret])
@modal.asgi_app()
def fastapi_app():
    from app.main import app as fastapi_instance
    return fastapi_instance
