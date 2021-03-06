# -*- coding: utf-8 -*-
"""Request institution parent link model."""

from . import Invite
from . import Request
from google.appengine.ext import ndb
from send_email_hierarchy import RequestLinkEmailSender
from util import get_subject

__all__ = ['RequestInstitutionParent']

class RequestInstitutionParent(Request):
    """Model of request parent institution."""

    @staticmethod
    def create(data):
        """Create a request and check required fields."""
        request = RequestInstitutionParent()
        request.sender_key = ndb.Key(urlsafe=data.get('sender_key'))
        request.institution_requested_key = ndb.Key(urlsafe=data.get('institution_requested_key'))
        request = Invite.create(data, request)
        request.isValid()
        return request

    def send_email(self, host):
        """Method of send email of request institution link."""
        parent_institution = self.institution_requested_key.get()
        child_institution = self.institution_key.get()

        subject = get_subject('REQUEST_LINK')
        email_sender = RequestLinkEmailSender(**{
            'receiver': parent_institution.admin.get().email[0],
            'subject': subject,
            'institution_parent_name': parent_institution.name,
            'institution_parent_email': parent_institution.institutional_email,
            'institution_child_name': child_institution.name,
            'institution_child_email': child_institution.institutional_email,
            'institution_requested_key': parent_institution.key.urlsafe()
        })
        email_sender.send_email()

    def send_response_email(self, operation):
        parent_institution = self.institution_requested_key.get()
        child_institution = self.institution_key.get()
        if operation == "ACCEPT":
            html = 'accept_institution_link_email.html'
            type_subject = 'LINK_CONFIRM' 
        else:
            html = 'reject_institutional_link.html'
            type_subject = 'REJECT_LINK_EMAIL'
        
        subject = get_subject(type_subject)
        email_sender = RequestLinkEmailSender(**{
            'receiver': child_institution.admin.get().email[0],
            'subject': subject,
            'institution_parent_name': parent_institution.name,
            'institution_parent_email': parent_institution.institutional_email,
            'institution_child_name': child_institution.name,
            'institution_child_email': child_institution.institutional_email,
            'institution_requested_key': parent_institution.key.urlsafe(),
            'html': html
        })
        email_sender.send_email()

    def send_notification(self, current_institution):
        """Method of send notification of request institution parent."""
        notification_type = 'REQUEST_INSTITUTION_PARENT'
        admin = self.institution_requested_key.get().admin
        notification_message = self.create_notification_message(user_key=self.sender_key, 
            current_institution_key=current_institution, sender_institution_key=self.institution_key,
            receiver_institution_key=self.institution_requested_key)

        super(RequestInstitutionParent, self).send_notification(
            current_institution=current_institution, 
            receiver_key=admin, 
            notification_type=notification_type,
            message=notification_message
        )

    def send_response_notification(self, current_institution, invitee_key, action):
        """Send notification to sender of invite when invite is accepted or rejected."""
        notification_type = 'ACCEPT_INSTITUTION_LINK' if action == 'ACCEPT' else 'REJECT_INSTITUTION_LINK'
        notification_message = self.create_notification_message(user_key=invitee_key, 
            current_institution_key=current_institution, receiver_institution_key=self.institution_key, 
            sender_institution_key=self.institution_requested_key)
        
        super(RequestInstitutionParent, self).send_notification(
            current_institution=current_institution,
            receiver_key=self.sender_key or self.admin_key,
            notification_type=notification_type,
            message=notification_message
        )

    def make(self):
        """Create json of request to parent institution."""
        request_inst_parent_json = super(RequestInstitutionParent, self).make()
        request_inst_parent_json['institution_requested_key'] = self.institution_requested_key.urlsafe()
        request_inst_parent_json['type_of_invite'] = 'REQUEST_INSTITUTION_PARENT'
        return request_inst_parent_json
