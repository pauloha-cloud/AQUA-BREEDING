from fastapi import FastAPI, BackgroundTasks, Request
from app.domain.models import JobMessage
from app.process_job import JobProcessor
from app.infrastructure.monitoring import telemetry
import logging

app = FastAPI()
processor = JobProcessor()
logger = logging.getLogger(__name__)

@app.get("/health")
def health():
    return {"status": "healthy"}

@app.post("/pubsub/handler")
async def handler(request: Request, background_tasks: BackgroundTasks):
    """
    Consumes messages from Google Cloud Pub/Sub via Cloud Run push subscription.
    """
    try:
        body = await request.json()
        job = JobMessage(**body)
        telemetry.log_structured("INFO", f"Received job {job.job_id}", {"handler": "pubsub"})
        background_tasks.add_task(processor.process, job)
        return {"status": "accepted", "job_id": job.job_id}
    except Exception as e:
        telemetry.log_structured("ERROR", "Failed to handle pubsub event", {"error": str(e)})
        return {"status": "error", "message": str(e)}, 400
