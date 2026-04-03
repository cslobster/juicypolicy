"""
Local quote worker that scrapes CoveredCA for pending quotes.

Run with: uv run quote_worker.py
"""
import time
import requests
import traceback
from playwright.sync_api import sync_playwright

API_BASE_URL = "http://localhost:3001"
WORKER_AUTH_TOKEN = "juicypolicy_worker_token_2026"
POLL_INTERVAL = 15
HEADERS = {"Authorization": f"Bearer {WORKER_AUTH_TOKEN}"}


def report_status(quote_id, status, message):
    """Report progress back to the API so the frontend can show it."""
    try:
        requests.post(
            f"{API_BASE_URL}/api/quotes/{quote_id}/status",
            json={"quote_status": status, "status_message": message},
            headers=HEADERS,
        )
    except Exception:
        pass  # Non-critical, don't break the worker


def get_next_quote():
    try:
        response = requests.get(
            f"{API_BASE_URL}/api/quotes/next-pending",
            headers=HEADERS,
        )
        if response.status_code == 404:
            return None
        response.raise_for_status()
        return response.json()
    except requests.exceptions.HTTPError as e:
        if e.response.status_code == 404:
            return None
        print(f"Error getting next quote: {e}")
        return None
    except Exception as e:
        print(f"Error getting next quote: {e}")
        return None


def submit_result(quote_id, result):
    try:
        response = requests.post(
            f"{API_BASE_URL}/api/quotes/{quote_id}/result",
            json=result,
            headers=HEADERS,
        )
        response.raise_for_status()
        print(f"Result submitted for quote #{quote_id}")
        return True
    except Exception as e:
        print(f"Failed to submit result for quote #{quote_id}: {e}")
        return False


def scrape_quote(quote_id, zip_code, income, ages):
    print(f"\n{'='*60}")
    print(f"Processing Quote #{quote_id}")
    print(f"  ZIP: {zip_code}, Income: {income}, Ages: {ages}")
    print(f"{'='*60}\n")

    report_status(quote_id, "scraping", "Launching browser...")

    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=False)
        context = browser.new_context()
        page = context.new_page()
        page.set_default_timeout(300000)

        try:
            # Navigate
            report_status(quote_id, "scraping", "Opening CoveredCA website...")
            print("Navigating to CoveredCA...")
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
            report_status(quote_id, "scraping", f"Entering ZIP code {zip_code}...")
            print("Filling zip code...")
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
            report_status(quote_id, "scraping", f"Entering income ${income}...")
            print("Filling income...")
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
            report_status(quote_id, "scraping", f"Setting household size to {len(ages)}...")
            print("Setting household size...")
            household = page.locator("#householdPeopleCount")
            household.get_by_role("combobox").click()
            household.locator('input[role="combobox"]').fill(str(len(ages)))
            household.locator('input[role="combobox"]').press("Enter")

            # Fill ages
            report_status(quote_id, "scraping", f"Entering ages: {ages}...")
            print("Filling ages...")
            for index, age in enumerate(ages):
                age_input = page.locator(f"#age_hhMember_{index}")
                age_input.click()
                age_input.fill(str(age))

            # Submit form
            report_status(quote_id, "scraping", "Submitting form to CoveredCA...")
            print("Submitting form...")
            result_button = page.get_by_test_id("result-button")
            result_button_handle = result_button.element_handle()
            page.wait_for_function("button => !button.disabled", arg=result_button_handle, timeout=60000)
            result_button.click()
            page.wait_for_timeout(2000)
            page.get_by_role("button", name="Continue").click()
            page.wait_for_load_state("networkidle", timeout=60000)

            # Navigate to results
            report_status(quote_id, "scraping", "Waiting for CoveredCA to calculate plans...")
            print("Navigating to results...")
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
            report_status(quote_id, "scraping", "Collecting plan results (page 1)...")
            print("Collecting results...")
            page.get_by_role("button", name="page 1").click()
            page.wait_for_timeout(2000)

            results_text = []
            results_locator = page.locator('xpath=//*[@id="root"]/div[6]/div[1]/ul/div/div[2]/div')
            page.wait_for_timeout(1000)
            results_text.append(results_locator.inner_text())

            page_num = 2
            while True:
                try:
                    report_status(quote_id, "scraping", f"Collecting plan results (page {page_num})...")
                    page.get_by_role("button", name="Go to next page").click(timeout=2000)
                    results_text.append(results_locator.inner_text())
                    page_num += 1
                except:
                    break

            result_text = "\n\n".join(results_text)
            total_pages = len(results_text)
            print(f"Scraped {total_pages} pages successfully")
            report_status(quote_id, "scraping", f"Scraped {total_pages} pages. Submitting results...")

            context.close()
            browser.close()

            return {
                "status": "success",
                "zip_code": zip_code,
                "income": income,
                "ages": ages,
                "results": result_text,
                "page_count": total_pages,
            }

        except Exception as e:
            error_msg = str(e)
            print(f"Error: {error_msg}")
            report_status(quote_id, "error", f"Scraping failed: {error_msg[:100]}")
            try:
                context.close()
                browser.close()
            except:
                pass
            return {
                "status": "error",
                "error": error_msg,
                "traceback": traceback.format_exc(),
                "parameters": {"zip_code": zip_code, "income": income, "ages": ages},
            }


def main():
    print("=" * 60)
    print("JuicyPolicy Quote Worker Started")
    print(f"API: {API_BASE_URL}")
    print(f"Poll Interval: {POLL_INTERVAL}s")
    print("=" * 60)

    while True:
        try:
            quote_data = get_next_quote()
            if quote_data is None:
                print(f"No pending quotes. Waiting {POLL_INTERVAL}s...")
                time.sleep(POLL_INTERVAL)
                continue

            quote_id = quote_data["quote_id"]
            result = scrape_quote(
                quote_id=quote_id,
                zip_code=quote_data["zip_code"],
                income=quote_data["income"],
                ages=quote_data["ages"],
            )
            submit_result(quote_id, result)

            print(f"\nWaiting {POLL_INTERVAL}s before next check...\n")
            time.sleep(POLL_INTERVAL)

        except KeyboardInterrupt:
            print("\nWorker stopped by user")
            break
        except Exception as e:
            print(f"\nUnexpected error: {e}")
            print(traceback.format_exc())
            time.sleep(POLL_INTERVAL)


if __name__ == "__main__":
    main()
