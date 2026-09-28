from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.auth import verify_google_id_token, create_access_token, get_current_user
from app.database import get_db
from app.models import User
from app.schemas import GoogleAuthRequest, TokenResponse, UserOut

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/google", response_model=TokenResponse)
def google_sign_in(body: GoogleAuthRequest, db: Session = Depends(get_db)):
    """
    Expo app flow:
      1. User signs in with Google on-device (expo-auth-session or
         @react-native-google-signin/google-signin)
      2. App sends the resulting Google ID token here
      3. We verify it server-side, create the user if new, and return
         our OWN JWT for the app to use on subsequent requests
    """
    payload = verify_google_id_token(body.id_token)

    google_sub = payload["sub"]
    email = payload["email"]
    name = payload.get("name")

    user = db.query(User).filter(User.google_sub == google_sub).first()
    if user is None:
        user = User(google_sub=google_sub, email=email, display_name=name)
        db.add(user)
        db.commit()
        db.refresh(user)

    access_token = create_access_token(user.id)
    return TokenResponse(access_token=access_token)


@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user
