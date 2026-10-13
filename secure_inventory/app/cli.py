"""python -m app.cli gen-key | create-admin"""
import base64
import getpass
import os
import sys


def gen_key() -> None:
    print(base64.urlsafe_b64encode(os.urandom(32)).decode())


def create_admin() -> None:
    from .audit import audit
    from .db import Base, SessionLocal, engine
    from .models import Policy, Role, User
    from .security import hash_password, password_problems
    Base.metadata.create_all(engine)
    username = input("Admin username: ").strip().lower()
    pw = getpass.getpass("Password (hidden): ")  # never passed as an argument => not in shell history / ps
    if getpass.getpass("Repeat: ") != pw:
        sys.exit("Passwords differ")
    if problems := password_problems(pw, username):
        sys.exit("Password " + "; ".join(problems))
    with SessionLocal() as db:
        if db.get(Policy, 1) is None:
            db.add(Policy(id=1))
        u = User(username=username, password_hash=hash_password(pw), role=Role.ADMIN, must_change_password=False)
        db.add(u)
        db.flush()
        audit(db, None, "ADMIN_BOOTSTRAP", "user", u.id)
        db.commit()
    print("Admin created.")


if __name__ == "__main__":
    {"gen-key": gen_key, "create-admin": create_admin}.get(sys.argv[1] if len(sys.argv) > 1 else "", lambda: sys.exit(__doc__))()
