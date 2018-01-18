# -*- coding: utf-8 -*-
"""Resend Invite Handler Test."""

import json
from search_module.search_institution import SearchInstitution
from test_base_handler import TestBaseHandler
from models.user import User
from models.institution import Institution
from models.institution import Address
from models.invite_user import InviteUser
from models.invite_institution import InviteInstitution
from handlers.resend_invite_handler import ResendInviteHandler
import mocks

import mock
from mock import patch


class ResendInviteHandlerTest(TestBaseHandler):
    """Resend Invite Handler Test."""

    INVITE_URI = "/api/invites/(.*)/resend"

    @classmethod
    def setUp(cls):
        """Provide the base for the tests."""
        super(ResendInviteHandlerTest, cls).setUp()
        app = cls.webapp2.WSGIApplication(
            [(ResendInviteHandlerTest.INVITE_URI, ResendInviteHandler),
             ], debug=True)
        cls.testapp = cls.webtest.TestApp(app)

    @mock.patch('models.invite_user.InviteUser.send_email')
    @mock.patch('models.invite_user.InviteUser.send_notification')
    @patch('utils.verify_token', return_value={'email': 'user@gmail.com'})
    def test_post(self, verify_token, mock_method, second_mock_method):
        """Test post."""
        user = mocks.create_user("user@gmail.com")
        institution = mocks.create_institution()
        invite = mocks.create_invite(user, institution.key, "USER")
        user.add_permission("invite_members", institution.key.urlsafe())
        user.put()
        # Call the post method
        self.testapp.post("/api/invites/%s/resend" %
                          invite.key.urlsafe())
        self.assertTrue(mock_method.called)
        self.assertTrue(second_mock_method.called)