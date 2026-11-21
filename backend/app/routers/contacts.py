from fastapi import APIRouter, Depends, HTTPException, Response, status
from pydantic import BaseModel, field_validator
from sqlmodel import Session, select

from app.db import get_session
from app.models import Contact

router = APIRouter(prefix="/contacts", tags=["contacts"])


class ContactCreate(BaseModel):
    name: str
    phone: str | None = None
    telegram_chat_id: str | None = None

    @field_validator("name")
    @classmethod
    def name_not_blank(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("name must not be empty")
        return v

    @field_validator("phone", "telegram_chat_id")
    @classmethod
    def blank_to_none(cls, v: str | None) -> str | None:
        v = v.strip() if v else v
        return v or None


@router.get("", response_model=list[Contact])
def list_contacts(session: Session = Depends(get_session)):
    return session.exec(select(Contact).order_by(Contact.id)).all()


@router.post("", response_model=Contact, status_code=status.HTTP_201_CREATED)
def create_contact(body: ContactCreate, session: Session = Depends(get_session)):
    contact = Contact(**body.model_dump())
    session.add(contact)
    session.commit()
    session.refresh(contact)
    return contact


@router.delete("/{contact_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_contact(contact_id: int, session: Session = Depends(get_session)):
    contact = session.get(Contact, contact_id)
    if contact is None:
        raise HTTPException(status_code=404, detail="Contact not found")
    session.delete(contact)
    session.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
