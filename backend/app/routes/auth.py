from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from beanie.operators import Or
from ..models.auth import User, UserRole, B2BApplication, B2BStatus
from ..schemas.auth import UserCreate, UserLogin, Token, UserResponse, B2BApplicationCreate, B2BApplicationProcess
from ..services.auth_service import AuthService, SECRET_KEY, ALGORITHM
from datetime import datetime

router = APIRouter(prefix="/auth", tags=["Authentication"])

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    payload = AuthService.decode_token(token)
    if payload is None:
        raise credentials_exception
    
    sub: str = payload.get("sub")
    if sub is None:
        raise credentials_exception
        
    # Search by email or username
    user = await User.find_one(Or(User.email == sub, User.username == sub))
    
    if user is None:
        raise credentials_exception
    return user

async def get_optional_user(token: Optional[str] = Depends(OAuth2PasswordBearer(tokenUrl="auth/login", auto_error=False))):
    if token is None:
        return None
    try:
        payload = AuthService.decode_token(token)
        if payload is None:
            return None
        sub: str = payload.get("sub")
        if sub is None:
            return None
        user = await User.find_one(Or(User.email == sub, User.username == sub))
        return user
    except Exception:
        return None

def check_role(roles: list):
    async def role_dependency(user: User = Depends(get_current_user)):
        if user.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not enough permissions"
            )
        return user
    return role_dependency

@router.post("/register", response_model=UserResponse)
async def register(user_in: UserCreate):
    # Check if user already exists by email or username
    if user_in.email:
        existing_email = await User.find_one(User.email == user_in.email)
        if existing_email:
            raise HTTPException(status_code=400, detail="Email already registered")
    
    if user_in.username:
        existing_user = await User.find_one(User.username == user_in.username)
        if existing_user:
            raise HTTPException(status_code=400, detail="Username already registered")
    
    user = User(
        username=user_in.username,
        email=user_in.email,
        password_hash=AuthService.get_password_hash(user_in.password),
        full_name=user_in.full_name,
        role=UserRole.CUSTOMER_B2C
    )
    await user.insert()
    return user

@router.post("/login", response_model=Token)
async def login(form_data: UserLogin):
    print(f"[AUTH] Login attempt for: {form_data.username or form_data.email}")
    user = None
    if form_data.username:
        user = await User.find_one(User.username == form_data.username)
    elif form_data.email:
        user = await User.find_one(User.email == form_data.email)
    
    if not user:
        print(f"[AUTH] User not found: {form_data.username or form_data.email}")
        raise HTTPException(status_code=400, detail="Incorrect identifier or password")
        
    print(f"[AUTH] User found, verifying password for: {user.username}")
    if not AuthService.verify_password(form_data.password, user.password_hash):
        print(f"[AUTH] Password verification failed for: {user.username}")
        raise HTTPException(status_code=400, detail="Incorrect identifier or password")
    
    print(f"[AUTH] Password verified, creating token for: {user.username}")
    # Use whichever identifier is available
    identifier = user.username if user.username else user.email
    access_token = AuthService.create_access_token(data={"sub": identifier, "role": user.role})
    
    # Update last login
    user.last_login = datetime.utcnow()
    await user.save()
    
    print(f"[AUTH] Login successful for: {user.username}")
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=UserResponse)
async def read_users_me(current_user: User = Depends(get_current_user)):
    print(f"[AUTH] Fetching /me for user: {current_user.username}")
    return current_user

@router.post("/apply-b2b")
async def apply_b2b(app_in: B2BApplicationCreate):
    # Check if a pending application already exists for this email or RUC
    existing = await B2BApplication.find_one(
        Or(B2BApplication.email == app_in.email, B2BApplication.ruc == app_in.ruc),
        B2BApplication.status == B2BStatus.PENDING
    )
    if existing:
        raise HTTPException(status_code=400, detail="A pending application already exists")
    
    application = B2BApplication(**app_in.dict())
    await application.insert()
    return {"message": "Application submitted successfully"}

@router.get("/b2b-applications", response_model=List[B2BApplication])
async def list_b2b_applications(
    current_user: User = Depends(check_role([UserRole.ADMIN, UserRole.SUPERADMIN]))
):
    return await B2BApplication.find_all().to_list()

@router.put("/b2b-applications/{app_id}")
async def update_b2b_application(
    app_id: str,
    update_data: B2BApplicationCreate,
    current_user: User = Depends(check_role([UserRole.ADMIN, UserRole.SUPERADMIN]))
):
    application = await B2BApplication.get(app_id)
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    
    # Update fields
    application.ruc = update_data.ruc
    application.company_name = update_data.company_name
    application.contact_person = update_data.contact_person
    application.email = update_data.email
    application.phone = update_data.phone
    application.address = update_data.address
    
    await application.save()
    return application

@router.post("/b2b-applications/{app_id}/process")
async def process_b2b_application(
    app_id: str,
    process_in: B2BApplicationProcess,
    current_user: User = Depends(check_role([UserRole.ADMIN, UserRole.SUPERADMIN])),
    target_username: Optional[str] = None,
    target_password: Optional[str] = None
):
    application = await B2BApplication.get(app_id)
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    
    application.status = process_in.status
    application.admin_notes = process_in.admin_notes
    application.processed_at = datetime.utcnow()
    application.processed_by = current_user.username or current_user.email
    await application.save()

    if process_in.status == B2BStatus.APPROVED and target_username and target_password:
        # Check if user already exists
        user_exists = await User.find_one(Or(User.username == target_username, User.email == application.email))
        if user_exists:
            # Upgrade existing user
            user_exists.role = UserRole.CUSTOMER_B2B
            user_exists.ruc_linked = application.ruc
            user_exists.full_name = application.company_name
            await user_exists.save()
            return {"message": "Existing user promoted to B2B"}
        else:
            # Create a brand new B2B User
            new_user = User(
                username=target_username,
                email=application.email,
                password_hash=AuthService.get_password_hash(target_password),
                full_name=application.company_name,
                role=UserRole.CUSTOMER_B2B,
                ruc_linked=application.ruc
            )
            await new_user.insert()
            return {"message": "New B2B user account created successfully"}

    return {"message": f"Application {process_in.status}"}
