import asyncio
from playwright.async_api import async_playwright

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        # Navigate to the site
        await page.goto("http://localhost:5173", wait_until="networkidle")

        # Wait for the word slot to be available
        await page.wait_for_selector(".word-slot")

        # Click on the first slot to enter edit mode
        await page.click(".word-slot[data-col-index='0'][data-position='0']")

        # Type "prediction"
        await page.fill(".word-edit-input", "prediction")

        # Hit Enter to save
        await page.keyboard.press("Enter")
        await page.wait_for_timeout(500)

        # Click the auto-parse (magic wand) to populate initially
        await page.evaluate("document.querySelector('.word-slot[data-col-index=\"0\"][data-position=\"0\"] .parse-button').click()")
        await page.wait_for_timeout(1000)

        # Take screenshot of the regular UI with parsed tags
        await page.screenshot(path="verification_tag_manual_1.png")

        # Click the edit button
        await page.evaluate("document.querySelector('.word-slot[data-col-index=\"0\"][data-position=\"0\"] .edit-button').click()")
        await page.wait_for_timeout(500)

        # Click the '+' button in edit mode
        page.once("dialog", lambda dialog: dialog.accept("extra-"))
        await page.evaluate("document.querySelector('.add-morpheme-btn').click()")
        await page.wait_for_timeout(500)

        # Take screenshot of edit mode with new tag
        await page.screenshot(path="verification_tag_manual_2.png")

        # Click delete (x) on a tag (assuming the first tag)
        await page.evaluate("document.querySelector('button[data-index=\"0\"]').click()")
        await page.wait_for_timeout(500)

        # Take screenshot after deletion
        await page.screenshot(path="verification_tag_manual_3.png")

        # Save again by hitting Enter
        await page.keyboard.press("Enter")
        await page.wait_for_timeout(1000)

        # Final screenshot
        await page.screenshot(path="verification_tag_manual_4.png")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(run())
