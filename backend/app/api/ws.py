import json
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from app.services.ws_manager import ws_manager
from app.utils.security import decode_token

router = APIRouter(tags=["WebSocket"])

@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket, token: str = Query(None)):
    # Validate token query param if provided
    if token:
        payload = decode_token(token)
        if not payload or payload.get("type") != "access":
            await websocket.close(code=1008)
            return

    await ws_manager.connect(websocket)
    try:
        # Send initial connected banner
        await websocket.send_text(json.dumps({"event": "connected", "message": "Subscribed to VPS Fleet live updates"}))
        while True:
            # Keep connection alive, listen for client ping
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text(json.dumps({"event": "pong"}))
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)
    except Exception:
        ws_manager.disconnect(websocket)
