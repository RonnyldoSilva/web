# -*- coding: utf-8 -*-

from ..test_base import TestBase

from models.invite import Invite
from models.institution import Institution
from models.user import User


class InviteTest(TestBase):
    """Test invite model."""

    @classmethod
    def setUp(cls):
        """Provide the base for the tests."""
        cls.test = cls.testbed.Testbed()
        cls.test.activate()
        cls.policy = cls.datastore.PseudoRandomHRConsistencyPolicy(
            probability=1)
        cls.test.init_datastore_v3_stub(consistency_policy=cls.policy)
        cls.test.init_memcache_stub()
        initModels(cls)

    def test_create(self):
        """Test invite create method."""
        data = {
            "admin_key": self.admin.key.urlsafe(),
            "is_request": False,
            "institution_key": self.institution.key.urlsafe(),
            "sender_key": self.admin.key.urlsafe(),
            "sender_name": self.admin.name
        }

        # test the case in which the data has the sender key and name
        invite = Invite()
        created_invite = Invite.create(data, invite)

        expected_invite = Invite()
        expected_invite.admin_key = self.admin.key
        expected_invite.is_request = False
        expected_invite.institution_key = self.institution.key
        expected_invite.sender_key = self.admin.key
        expected_invite.sender_name = self.admin.name

        self.assertEquals(
            created_invite,
            expected_invite,
            "The created invite should be iqual to the expected one"
        )

        # test the case in which the sender key is get from the invite
        data["sender_key"] = None
        data["sender_name"] = None
        invite.admin_key = self.admin.key
        created_invite = Invite.create(data, invite)

        self.assertEquals(
            created_invite,
            expected_invite,
            "The created invite should be iqual to the expected one"
        )

    def test_change_status(self):
        """Test change_status method."""
        self.assertEquals(
            self.invite.status,
            "sent",
            "The invite status should be 'sent'"
        )

        self.invite.change_status("rejected")

        self.assertEquals(
            self.invite.status,
            "rejected",
            "The invite status should be 'rejected'"
        )

    def test_make(self):
        """Test make method."""
        REQUIRED_PROPERTIES = ['name', 'address', 'description',
                               'key', 'photo_url', 'email',
                               'phone_number']

        expected_maked_invite = {
            'admin_name': self.admin.name,
            'sender_name': self.invite.sender_name,
            'key': self.invite.key.urlsafe(),
            'status': self.invite.status,
            'institution_admin': self.institution.make(["name"]),
            'institution': self.institution.make(REQUIRED_PROPERTIES)
        }

        maked_invite = self.invite.make()

        self.assertEquals(
            maked_invite,
            expected_maked_invite,
            "The invited maked should be equal to the expected one"
        )


def initModels(cls):
    """Initialize the models."""
    # admin
    cls.admin = User()
    cls.admin.name = "admin"
    cls.admin.email = ["admin@email"]
    cls.admin.put()

    # user
    cls.user = User()
    cls.user.name = "user"
    cls.user.email = ["user@email"]
    cls.user.put()

    # New institution
    cls.institution = Institution()
    cls.institution.name = "institution"
    cls.institution.admin = cls.admin.key
    cls.institution.members = [cls.admin.key]
    cls.institution.followers = [cls.admin.key]
    cls.institution.put()

    # update admin
    cls.admin.institutions_admin = [cls.institution.key]
    cls.admin.put()

    # New invite
    cls.invite = Invite()
    cls.invite.invitee = cls.user.email[0]
    cls.invite.admin_key = cls.admin.key
    cls.invite.sender_key = cls.admin.key
    cls.invite.sender_name = cls.admin.name
    cls.invite.status = "sent"
    cls.invite.institution_key = cls.institution.key
    cls.invite.put()
