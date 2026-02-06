import datetime
import os.path
from fastapi import FastAPI
from fastapi.responses import StreamingResponse
import json
import asyncio
from fastapi.middleware.cors import CORSMiddleware
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from webdriver_manager.chrome import ChromeDriverManager
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from pydantic import BaseModel

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)
class SyncRequest(BaseModel):
    venue_id: str
    username: str
    password: str
    
# --- CONFIGURATION ---
ABI_URL = "https://ess.abimm.com/ABIMM_ASP/Request.aspx"
SCOPES = ['https://www.googleapis.com/auth/calendar']

def get_google_calendar_service():
    creds = None
    token_data = os.environ.get("GOOGLE_TOKEN_JSON")
    creds_json = os.environ.get("GOOGLE_CREDENTIALS_JSON")
    if token_data:
        # Load credentials from the environment variable string
        token_info = json.loads(token_data)
        creds = Credentials.from_authorized_user_info(token_info, SCOPES)
    elif os.path.exists('token.json'):
        creds = Credentials.from_authorized_user_file('token.json', SCOPES)

    if creds and creds.expired and creds.refresh_token:
        creds.refresh(Request())
    if not creds:
        raise Exception("Google Auth failed: No token found in environment or local file. "
                        "Please run the script locally once to generate token.json.")
    return build('calendar', 'v3', credentials=creds)

def run_sync_process(venue_id, username, password):
    chrome_options = Options()
    chrome_options.add_argument("--headless")
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage")
    
    driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=chrome_options)
    driver.get(ABI_URL)
    
    try:
        # Login
        yield "Logging into ABI..."
        driver.find_element(By.ID, "input_venue").send_keys(venue_id)
        driver.find_element(By.CSS_SELECTOR, "input[value='Submit']").click()
        driver.implicitly_wait(10)
        driver.find_element(By.ID, "LoginId").send_keys(username)
        driver.find_element(By.ID, "PIN").send_keys(password)
        driver.find_element(By.ID, "loginButton").click()
        
        # Navigate to 'My Schedule'
        yield "Accessing Schedule..."
        driver.implicitly_wait(10)
        driver.find_element(By.LINK_TEXT, "View My Schedule").click()
        
        month_year_text = driver.find_element(By.CLASS_NAME, "MonthTitle").text
        header_date = datetime.datetime.strptime(month_year_text, "%B %Y")
        script = """
    return [...document.querySelectorAll('#calendar_table .calendar_day_box')].map(box => {
        let details = box.querySelector('.day_details');
        if (!details) return null;
        
        return {
            day: box.innerText.split('\\n')[0].trim(),
            time: details.querySelector('a').innerText.split('(')[0].trim(),
            description: details.innerText
        };
    }).filter(item => item !== null);
    """
        shifts_data = driver.execute_script(script)
        
        yield f"Found {len(shifts_data)} shifts. Uploading..."
        cal_service = get_google_calendar_service()
        for i, shift in enumerate(shifts_data):
            start_time_str, end_time_str = shift['time'].split(' - ')
            start_dt = parse_shift_time(header_date.year, header_date.month, shift['day'], start_time_str)
            end_dt = parse_shift_time(header_date.year, header_date.month, shift['day'], end_time_str)
            
            if end_dt < start_dt:
                end_dt += datetime.timedelta(days=1)

            offset = "-08:00"
            time_min = start_dt.isoformat() + offset
            time_max = (start_dt + datetime.timedelta(minutes=1)).isoformat() + offset
            events_result = cal_service.events().list(
                calendarId='primary', 
                timeMin=time_min,
                timeMax=time_max,
                singleEvents=True
            ).execute()
            existing_events = events_result.get('items', [])
            target_summary = f"Skate Guard: {shift['time']}".strip()
            
            is_duplicate = any(
                e.get('summary', '').strip() == target_summary 
                for e in existing_events
            )

            if is_duplicate:
                yield f"Skipped (Duplicate) Day {shift['day']}"
                continue
            event = {
                'summary': f"Skate Guard: {shift['time']}",
                'description': shift['description'],
                'start': {'dateTime': start_dt.isoformat(), 'timeZone': 'America/Los_Angeles'},
                'end': {'dateTime': end_dt.isoformat(), 'timeZone': 'America/Los_Angeles'},
            }
            cal_service.events().insert(calendarId='primary', body=event).execute()
            yield f"{shift['day']} at {shift['time']} ({i+1}/{len(shifts_data)})"
        yield "Sync Complete!"
    finally:
        driver.quit()

def parse_shift_time(year, month, day, time_str):    
    clean_day = "".join(filter(str.isdigit, str(day)))
    dt_str = f"{year}-{month}-{clean_day} {time_str}"
    return datetime.datetime.strptime(dt_str, "%Y-%m-%d %I:%M %p")

@app.post("/sync")
async def sync_shifts(request: SyncRequest):
    v_id = request.venue_id
    u_name = request.username
    p_word = request.password
    
    def event_generator():
        try:
            for message in run_sync_process(v_id, u_name, p_word):
                yield f"data: {json.dumps({'status': message})}\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'status': f'❌ Error: {str(e)}'})}\n\n"
    return StreamingResponse(event_generator(), media_type="text/event-stream")