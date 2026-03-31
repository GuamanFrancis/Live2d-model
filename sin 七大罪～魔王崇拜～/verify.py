import asyncio
import os
from playwright.async_api import async_playwright

VERIFICATION_DIR = "/home/jules/verification"

async def verify():
    # Ensure verification directory exists
    os.makedirs(VERIFICATION_DIR, exist_ok=True)

    async with async_playwright() as p:
        browser = await p.chromium.launch()
        # Create a context that records video
        context = await browser.new_context(record_video_dir=VERIFICATION_DIR)
        page = await context.new_page()

        print("Navigating to local server...")
        await page.goto("http://localhost:8000/index.html")

        print("Waiting for model to load...")
        # Wait until loading text disappears
        try:
            await page.wait_for_selector('#loading', state='hidden', timeout=10000)
            print("Model loaded successfully.")
        except Exception as e:
            print("Timeout waiting for model to load.")

        print("Waiting to capture interactions...")
        await asyncio.sleep(2)  # Give it time to render

        # Take a screenshot
        screenshot_path = os.path.join(VERIFICATION_DIR, "live2d_screenshot.png")
        await page.screenshot(path=screenshot_path)
        print(f"Screenshot saved to {screenshot_path}")

        # Simulate pointer interaction
        print("Simulating pointer movement...")
        box = await page.evaluate("() => ({ width: window.innerWidth, height: window.innerHeight })")
        width, height = box['width'], box['height']

        # Move cursor to top left, bottom right, center
        await page.mouse.move(width * 0.25, height * 0.25)
        await asyncio.sleep(1)
        await page.mouse.move(width * 0.75, height * 0.75)
        await asyncio.sleep(1)

        print("Simulating pointer click...")
        await page.mouse.click(width * 0.5, height * 0.5)
        await asyncio.sleep(3) # Wait for animation to play

        # Close context and browser to finalize video
        await context.close()
        await browser.close()
        print("Verification complete.")

if __name__ == "__main__":
    asyncio.run(verify())