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
    """Modal function that scrapes CoveredCA with retry on stuck stages."""
    import traceback
    from playwright.sync_api import sync_playwright
    from app.database import SessionLocal
    from app import models
    from app.quote_service import convert_quote_text_to_json

    MAX_RETRIES = 3
    STAGE_TIMEOUT = 60000  # 60s per stage

    db = SessionLocal()

    def update_status(status, message):
        quote = db.query(models.Quote).filter(models.Quote.quote_id == quote_id).first()
        if quote:
            quote.quote_status = status
            quote.status_message = message
            db.commit()

    def do_scrape():
        """Run the full scrape. Raises on any failure so caller can retry."""
        with sync_playwright() as playwright:
            browser = playwright.chromium.launch(headless=True)
            context = browser.new_context()
            page = context.new_page()
            page.set_default_timeout(STAGE_TIMEOUT)

            update_status("scraping", "Opening CoveredCA website...")
            page.goto("https://apply.coveredca.com/lw-shopandcompare/", timeout=STAGE_TIMEOUT)
            page.wait_for_load_state("networkidle", timeout=STAGE_TIMEOUT)
            page.wait_for_timeout(3000)

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
            zip_input = page.locator('#zip')
            zip_input.wait_for(state="visible", timeout=10000)
            zip_input.click()
            zip_input.fill(zip_code)
            page.wait_for_timeout(1000)

            # Check for "Zip Code is not in Service Area" dialog
            page.wait_for_timeout(2000)
            service_area_dialog = page.locator('text=not in Service Area')
            if service_area_dialog.count() > 0:
                raise Exception(f"邮编 {zip_code} 不在加州健保服务范围内，请使用有效的加州邮编")

            # Close any other popup dialog
            try:
                dialog_btn = page.locator('div[role="presentation"] button:has-text("Okay"), div[role="presentation"] button:has-text("OK"), div[role="presentation"] button:has-text("Close")')
                if dialog_btn.count() > 0:
                    dialog_btn.first.click(force=True)
                    page.wait_for_timeout(1000)
            except:
                pass

            # Fill income
            update_status("scraping", f"Entering income ${income}...")
            income_input = page.locator('#houseHoldIncome')
            income_input.wait_for(state="visible", timeout=10000)
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
            page.wait_for_function("button => !button.disabled", arg=result_button_handle, timeout=STAGE_TIMEOUT)
            result_button.click()
            page.wait_for_timeout(2000)
            page.get_by_role("button", name="Continue").click()
            page.wait_for_load_state("networkidle", timeout=STAGE_TIMEOUT)

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

            return "\n\n".join(results_text)

    try:
        print(f"Processing Quote #{quote_id}: ZIP={zip_code}, Income={income}, Ages={ages}")

        result_text = None
        last_error = None
        for attempt in range(1, MAX_RETRIES + 1):
            try:
                update_status("scraping", f"Launching browser... (attempt {attempt}/{MAX_RETRIES})")
                result_text = do_scrape()
                print(f"Attempt {attempt} succeeded, scraped data")
                break
            except Exception as e:
                last_error = e
                print(f"Attempt {attempt} failed: {e}")
                if attempt < MAX_RETRIES:
                    update_status("scraping", f"Attempt {attempt} failed, retrying...")

        if result_text is None:
            raise Exception(f"All {MAX_RETRIES} attempts failed. Last error: {last_error}")

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
