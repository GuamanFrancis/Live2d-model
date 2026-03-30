import asyncio
from playwright.async_api import async_playwright
import os
import time

async def verify_live2d():
    # Ensure verification directory exists
    os.makedirs("/home/jules/verification", exist_ok=True)

    async with async_playwright() as p:
        browser = await p.chromium.launch()

        # Setup context to record video
        context = await browser.new_context(
            record_video_dir="/home/jules/verification/",
            record_video_size={"width": 1280, "height": 720}
        )

        page = await context.new_page()
        await page.set_viewport_size({"width": 1280, "height": 720})

        # Navigate to the local server
        await page.goto("http://localhost:8080/index.html")

        # Wait for the model to load (look for the green "Modelo cargado y listo" text)
        print("Waiting for model to load...")
        try:
            await page.wait_for_selector("text='Modelo cargado y listo'", timeout=15000)
            print("Model loaded successfully!")
        except Exception as e:
            print("Could not find the 'Modelo cargado y listo' message. Taking a screenshot anyway.")

        # Move mouse around to trigger eye/head tracking
        print("Simulating mouse movements for tracking...")
        await page.mouse.move(100, 100)
        await page.wait_for_timeout(500)
        await page.mouse.move(1000, 100)
        await page.wait_for_timeout(500)
        await page.mouse.move(1000, 600)
        await page.wait_for_timeout(500)
        await page.mouse.move(640, 360) # Center
        await page.wait_for_timeout(1000)

        # Click the model to trigger a motion
        print("Clicking the model to trigger animation...")
        await page.mouse.click(640, 360) # Click near the center
        await page.wait_for_timeout(3000) # Wait to see the animation play out

        # Take a screenshot
        screenshot_path = "/home/jules/verification/live2d_poc_screenshot.png"
        await page.screenshot(path=screenshot_path)
        print(f"Screenshot saved to {screenshot_path}")

        # Close context and browser to finalize video recording
        await context.close()
        await browser.close()
        print("Verification complete! Video and screenshot are in /home/jules/verification/")

if __name__ == "__main__":
    asyncio.run(verify_live2d())
