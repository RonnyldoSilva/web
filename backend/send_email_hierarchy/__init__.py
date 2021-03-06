"""Initialize send email hierarchy modules."""

from .email_sender import *
from .request_institution_email_sender import *
from .invite_institution_email_sender import *
from .invite_user_email_sender import *
from .leave_institution_email_sender import *
from .remove_institution_email_sender import *
from .remove_member_email_sender import *
from .request_link_email_sender import *
from .request_user_email_sender import *
from .transfer_admin_email_sender import *


email_modules = [
    email_sender, request_institution_email_sender, invite_institution_email_sender,
    invite_user_email_sender, leave_institution_email_sender,
    remove_institution_email_sender, remove_member_email_sender,
    request_link_email_sender, request_user_email_sender, transfer_admin_email_sender
]

__all__ = [prop for email_module in email_modules for prop in email_module.__all__]