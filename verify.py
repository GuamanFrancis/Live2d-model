from playwright.sync_api import sync_playwright
import os

def run_cuj(page):
    # Set up console logging for debug
    page.on("console", lambda msg: print(f"Browser console: {msg.text}"))
    page.on("pageerror", lambda err: print(f"Browser error: {err}"))

    # Navigate to the local server
    page.goto("http://localhost:8000/index.html")
    page.wait_for_timeout(2000) # Wait for model to load and init

    # Simulate pointer movement to test tracking
    print("Testing pointer tracking...")
    page.mouse.move(100, 100)
    page.wait_for_timeout(500)
    page.mouse.move(500, 100)
    page.wait_for_timeout(500)
    page.mouse.move(300, 400)
    page.wait_for_timeout(500)

    # Click on the model to test interaction/motions
    print("Testing interaction...")
    page.mouse.click(300, 300) # Assuming the model is centered here
    page.wait_for_timeout(2000) # Wait for animation to play

    # Take screenshot at the key moment
    os.makedirs("/home/jules/verification/screenshots", exist_ok=True)
    page.screenshot(path="/home/jules/verification/screenshots/verification.png")
    page.wait_for_timeout(1000)  # Hold final state for the video

if __name__ == "__main__":
    os.makedirs("/home/jules/verification/videos", exist_ok=True)
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            record_video_dir="/home/jules/verification/videos"
        )
        page = context.new_page()
        try:
            run_cuj(page)
        finally:
            context.close()  # MUST close context to save the video
            browser.close()
