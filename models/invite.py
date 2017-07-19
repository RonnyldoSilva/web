# -*- coding: utf-8 -*-
"""Invite Model."""
from google.appengine.ext import ndb
from google.appengine.api import mail
from custom_exceptions.fieldException import FieldException
from models.institution import Institution


class Invite(ndb.Model):
    """Model of Invite."""

    # Email of the invitee.
    invitee = ndb.StringProperty(required=True)

    # Type of Invite.
    type_of_invite = ndb.StringProperty(choices=set([
        'user',
        'institution',
        'institution_parent',
        'institution_children']), required=True)

    # Status of Invite.
    status = ndb.StringProperty(choices=set([
        'sent',
        'resolved']), default='sent')

    # Name of the institution invited, if the type of invite is institution.
    suggestion_institution_name = ndb.StringProperty()

    """ Key of the institution who user was
    invited to be member, if the type of invite is user."""
    institution_key = ndb.KeyProperty(kind="Institution", required=True)

    # Key of stub institution to wich the invite was send.
    # Value is None for invite the User
    stub_institution_key = ndb.KeyProperty(kind="Institution")

    @staticmethod
    def checkIsInviteInstitutionValid(data):
        """Check if invite for institution is valid."""
        if data.get('suggestion_institution_name') is None:
            raise FieldException(
                "The invite for institution have to specify the suggestion institution name")

    @staticmethod
    def create(data):
        """Create a post and check required fields."""
        invite = Invite()
        invite.invitee = data.get('invitee')
        invite.type_of_invite = data.get('type_of_invite')
        invite.institution_key = ndb.Key(urlsafe=data.get('institution_key'))

        if (invite.type_of_invite == 'institution' or
                invite.type_of_invite == 'institution_parent'):
            Invite.checkIsInviteInstitutionValid(data)
            invite.suggestion_institution_name = data[
                'suggestion_institution_name']

        if (invite.type_of_invite == 'institution_parent'):
            institution = Institution.create_parent_inst_stub(invite)
            invite.stub_institution_key = institution.key

        return invite

    @staticmethod
    def sendInvite(invite):
        """Send invite."""
        if invite.type_of_invite == 'user':
            Invite.sendInviteUser(invite)
        else:
            Invite.sendInviteInstitution(invite)

    @staticmethod
    def sendInviteUser(invite):
        """Send Invite for user to be member of some Institution."""
        mail.send_mail(sender="e-CIS <eciis@splab.ufcg.edu.br>",
                       to=invite.invitee,
                       subject="Convite plataforma e-CIS",
                       body="""Oi:

        Para realizar o cadastro cria sua conta em:
        http://eciis-splab.appspot.com a

        Equipe e-CIS
        """)

    @staticmethod
    def sendInviteInstitution(invite):
        """Send Invite for user create some Institution."""
        mail.send_mail(sender="e-CIS <eciis@splab.ufcg.edu.br>",
                       to="<%s>" % invite.invitee,
                       subject="Convite plataforma e-CIS",
                       body="""
        Sua empresa %s foi convidada a se cadastrar na plataforma.
        Para realizar o cadastro crie sua conta pessoal em
        http://eciis-splab.appspot.com  e proceda com o cadastro da sua empresa.

        Equipe e-CIS
        """ % invite.suggestion_institution_name)

    @staticmethod
    def make(invite):
        """Create personalized json of invite."""
        if invite.type_of_invite == 'user':
            return invite.make_invite_user()
        # TODO: Change to general when all type of invite to institution have stub
            # @author: Maiana Brito
        elif invite.type_of_invite == 'institution_parent':
            return invite.make_invite_parent_inst()
        else:
            return invite.make_invite_institution()

    def make_invite_parent_inst(self):
        """Create json of invite to parent institution."""
        return {
            'invitee': self.invitee,
            'type_of_invite': self.type_of_invite,
            'suggestion_institution_name': self.suggestion_institution_name,
            'institution_stub_key': self.stub_institution_key.urlsafe(),
            'key': self.key.urlsafe(),
            'status': self.status
        }

    def make_invite_user(self):
        """Create json of invite to user."""
        return {
            'invitee': self.invitee,
            'type_of_invite': self.type_of_invite,
            'institution_key': self.institution_key.urlsafe(),
            'key': self.key.urlsafe(),
            'status': self.status
        }

    def make_invite_institution(self):
        """Create json of invite to institution."""
        return {
            'invitee': self.invitee,
            'type_of_invite': self.type_of_invite,
            'suggestion_institution_name': self.suggestion_institution_name,
            'key': self.key.urlsafe(),
            'status': self.status
        }
