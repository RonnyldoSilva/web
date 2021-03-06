# -*- coding: utf-8 -*-
"""Institution Parent Collection request handler test."""

import json
from test_base_handler import TestBaseHandler
from models import User
from models import Institution
from models import Address
from handlers.institution_parent_request_collection_handler import InstitutionParentRequestCollectionHandler
import mocks

from mock import patch

ADMIN = {'email': 'user1@gmail.com'}
USER = {'email': 'otheruser@ccc.ufcg.edu.br'}

class InstitutionParentRequestCollectionHandlerTest(TestBaseHandler):
    """Test the handler InstitutionParentRequestCollectionHandler."""

    REQUEST_URI = "/api/institutions/(.*)/requests/institution_parent"

    @classmethod
    def setUp(cls):
        """Provide the base for the tests."""
        super(InstitutionParentRequestCollectionHandlerTest, cls).setUp()
        app = cls.webapp2.WSGIApplication(
            [(InstitutionParentRequestCollectionHandlerTest.REQUEST_URI, InstitutionParentRequestCollectionHandler),
             ], debug=True)
        cls.testapp = cls.webtest.TestApp(app)

    @patch('util.login_service.verify_token', return_value=ADMIN)
    def test_post(self, verify_token):
        """Test method post of InstitutionParentRequestCollectionHandler."""
        admin = mocks.create_user(ADMIN['email'])
        institution = mocks.create_institution()		 
        admin.institutions_admin = [institution.key]
        institution.admin = admin.key
        admin.add_permission("send_link_inst_request", institution.key.urlsafe())
        admin.put()
        institution.put()
        other_user = mocks.create_user(USER['email'])
        inst_requested = mocks.create_institution()
        admin_requested = mocks.create_user(ADMIN['email'])
        admin.institutions_admin = [inst_requested.key]
        admin_requested.put()
        inst_requested.admin = admin_requested.key 
        inst_requested.put()
        data = {
            'sender_key': admin.key.urlsafe(),
            'is_request': True,
            'admin_key': admin_requested.key.urlsafe(),
            'institution_key': institution.key.urlsafe(),
            'institution_requested_key': inst_requested.key.urlsafe(),
            'type_of_invite': 'REQUEST_INSTITUTION_PARENT'
        }
        body = {
            'data': data,
            'currentInstitution': {'name': 'currentInstitution'}
        }

        request = self.testapp.post_json(
            "/api/institutions/" + institution.key.urlsafe() + "/requests/institution_parent",
            data)

        request = json.loads(request._app_iter[0])

        institution = institution.key.get()

        self.assertEqual(
            request['sender'],
            admin.email,
            'Expected sender email is other_user@test.com')
        self.assertEqual(
            request['admin_name'],
            admin_requested.name,
            'Expected sender admin_name is User Admin')
        self.assertEqual(
            request['type_of_invite'],
            'REQUEST_INSTITUTION_PARENT',
            'Expected sender type_of_invite is REQUEST_INSTITUTION_PARENT')
        self.assertEqual(
            institution.parent_institution, inst_requested.key,
            "The parent institution of inst test must be update to inst_requested")
    
    @patch('util.login_service.verify_token', return_value=ADMIN)
    def test_post_with_wrong_institution(self, verify_token):
        """Test post with wrong institution."""
        admin = mocks.create_user(ADMIN['email'])
        institution = mocks.create_institution()
        institution.add_member(admin)
        admin.add_institution(institution.key)
        admin.add_institution_admin(institution.key)
        institution.set_admin(admin.key)
        admin.add_permission("send_link_inst_request",
                             institution.key.urlsafe())
        admin.put()
        institution.put()
        inst_requested = mocks.create_institution()
        admin_requested = mocks.create_user(USER['email'])
        admin.institutions_admin = [inst_requested.key]
        admin_requested.put()
        inst_requested.add_member(admin_requested)
        inst_requested.set_admin(admin_requested.key)
        inst_requested.put()
        data = {
            'sender_key': admin.key.urlsafe(),
            'is_request': True,
            'admin_key': admin_requested.key.urlsafe(),
            'institution_key': institution.key.urlsafe(),
            'institution_requested_key': inst_requested.key.urlsafe(),
            'type_of_invite': 'REQUEST_INSTITUTION_PARENT'
        }

        with self.assertRaises(Exception) as ex:
            self.testapp.post_json(
                "/api/institutions/" + inst_requested.key.urlsafe() + "/requests/institution_parent",
                data)

        exception_message = self.get_message_exception(ex.exception.message)
        self.assertEqual(
            "Error! User is not allowed to send request",
            exception_message,
            "Expected error message is Error! User is not allowed to send request")

    @patch('util.login_service.verify_token', return_value=USER)
    def test_post_user_not_admin(self, verify_token):
        #Test post request with user is not admin.
        admin = mocks.create_user(ADMIN['email'])
        institution = mocks.create_institution()		 
        admin.institutions_admin = [institution.key]
        institution.admin = admin.key
        admin.add_permission("send_link_inst_request", institution.key.urlsafe())
        admin.put()
        institution.put()
        other_user = mocks.create_user(USER['email'])
        inst_requested = mocks.create_institution()
        admin_requested = mocks.create_user(ADMIN['email'])
        admin.institutions_admin = [inst_requested.key]
        admin_requested.put()
        inst_requested.admin = admin_requested.key 
        inst_requested.put()
        data = {
            'sender_key': admin.key.urlsafe(),
            'is_request': True,
            'admin_key': admin_requested.key.urlsafe(),
            'institution_key': institution.key.urlsafe(),
            'institution_requested_key': inst_requested.key.urlsafe(),
            'type_of_invite': 'REQUEST_INSTITUTION_PARENT'
        }

        with self.assertRaises(Exception) as ex:
            self.testapp.post_json(
                "/api/institutions/" + institution.key.urlsafe() + "/requests/institution_parent",
                data)

        exception_message = self.get_message_exception(ex.exception.message)
        self.assertEqual(
            "Error! User is not allowed to send request",
            exception_message,
            "Expected error message is Error! User is not allowed to send request")


    @patch('util.login_service.verify_token', return_value=USER)
    def test_post_circular_hierarchy(self, verify_token):
        """
        Test post request when the user tries to create
        a circular hierarchy between institutions using
        a parent request."""

        # Hierarchy: inst_a -> inst_b -> inst_c
        inst_a = mocks.create_institution()
        inst_b = mocks.generate_child_to_parent(inst_a)
        inst_c = mocks.generate_child_to_parent(inst_b)

        # verifies the hierarchy
        self.assertEquals(
            inst_a.parent_institution, None,
            "inst_a should not have a parent"
        )
        self.assertTrue(
            inst_b.key in inst_a.children_institutions,
            "inst_b should be in inst_a children institutions"
        )
        self.assertEquals(
            inst_b.parent_institution, inst_a.key,
            "inst_a should be parent of inst_b"
        )
        self.assertTrue(
            inst_c.key in inst_b.children_institutions,
            "inst_c should be in inst_b children institutions"
        )
        self.assertEquals(
            inst_c.parent_institution, inst_b.key,
            "inst_b should be parent of inst_c"
        )
        self.assertEquals(
            inst_c.children_institutions, [],
            "inst_c should not have children institutions"
        )

        admin = mocks.create_user(USER['email'])
        admin.institutions_admin = [inst_a.key]
        admin.add_institution(inst_a.key)
        inst_a.admin = admin.key
        admin.add_permission("send_link_inst_request", inst_a.key.urlsafe())
        admin.put()
        inst_a.put()

        admin_requested = mocks.create_user(ADMIN['email'])
        admin_requested.institutions_admin = [inst_c.key]
        admin_requested.add_institution(inst_c.key)
        admin_requested.add_permission("send_link_inst_request", inst_c.key.urlsafe())
        inst_c.admin = admin_requested.key
        admin_requested.put()
        inst_c.put()

        data = {
            'sender_key': admin.key.urlsafe(),
            'is_request': True,
            'admin_key': admin_requested.key.urlsafe(),
            'institution_key': inst_a.key.urlsafe(),
            'institution_requested_key': inst_c.key.urlsafe(),
            'type_of_invite': 'REQUEST_INSTITUTION_PARENT'
        }

        with self.assertRaises(Exception) as ex:
            self.testapp.post_json(
                "/api/institutions/" + inst_a.key.urlsafe() + "/requests/institution_parent",
                data)

        
        exception_message = self.get_message_exception(ex.exception.message)
        expected_message = "Error! Circular hierarchy not allowed"
        self.assertEqual(
            expected_message, exception_message,
            "The expected error message is not equal to the exception one")

    @patch('util.login_service.verify_token', return_value=ADMIN)
    def test_post_with_a_institution_that_has_a_parent(self, verify_token):
        """Test method post of InstitutionParentRequestCollectionHandler."""
        admin = mocks.create_user(ADMIN['email'])
        institution = mocks.create_institution()
        admin.institutions_admin = [institution.key]
        institution.admin = admin.key
        admin.add_permission("send_link_inst_request",
                             institution.key.urlsafe())
        admin.put()
        inst_requested = mocks.create_institution()
        admin_requested = mocks.create_user(ADMIN['email'])
        admin.institutions_admin = [inst_requested.key]
        admin_requested.put()
        inst_requested.admin = admin_requested.key
        inst_requested.put()
        institution.parent_institution = inst_requested.key
        institution.put()

        data = {
            'sender_key': admin.key.urlsafe(),
            'is_request': True,
            'admin_key': admin_requested.key.urlsafe(),
            'institution_key': institution.key.urlsafe(),
            'institution_requested_key': inst_requested.key.urlsafe(),
            'type_of_invite': 'REQUEST_INSTITUTION_PARENT'
        }

        with self.assertRaises(Exception) as ex:
            self.testapp.post_json(
                "/api/institutions/" + institution.key.urlsafe() + "/requests/institution_parent",
                data
            )

        exception_message = self.get_message_exception(ex.exception.message)
        
        self.assertTrue(exception_message == "Error! The institution's already have a parent")
