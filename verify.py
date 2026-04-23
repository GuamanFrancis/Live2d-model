import asyncio
from playwright.async_api import async_playwright
import os

async def main():
    async with async_playwright() as p:
        # Launch Chromium with specific args for WebGL
        browser = await p.chromium.launch(
            headless=False,
            args=[
                "--use-gl=swiftshader",
                "--enable-webgl",
                "--disable-dev-shm-usage",
                "--no-sandbox"
            ]
        )

        # Ensure verification directory exists
        os.makedirs("/home/jules/verification/", exist_ok=True)

        # Create a new context with video recording enabled
        context = await browser.new_context(
            record_video_dir="/home/jules/verification/"
        )

        page = await context.new_page()

        # Log console messages and errors for debugging
        page.on("console", lambda msg: print(f"Browser console: {msg.text}"))
        page.on("pageerror", lambda err: print(f"Browser error: {err}"))

        await page.goto("http://localhost:3000/")

        # Wait for a reasonable amount of time for the Live2D model to load and render
        await page.wait_for_timeout(3000)

        # Click in the middle of the screen to trigger an animation
        viewport = page.viewport_size
        x = viewport['width'] / 2
        y = viewport['height'] / 2
        await page.mouse.click(x, y)

        # Wait a bit more to see the animation
        await page.wait_for_timeout(2000)

        # Take a screenshot
        await page.screenshot(path="/home/jules/verification/live2d_poc.png")

        # Close context and browser to save the video
        await context.close()
        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
