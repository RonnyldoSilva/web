# -*- coding: utf-8 -*-
"""Request Handler."""

import json
from utils import Utils
from google.appengine.ext import ndb
from utils import login_required
from utils import json_response
from handlers.base_handler import BaseHandler
from custom_exceptions.entityException import EntityException
from custom_exceptions.notAuthorizedException import NotAuthorizedException


def makeUser(user, request):
    """Method of make user."""
    user_json = Utils.toJson(user, host=request.host)
    user_json['logout'] = 'http://%s/logout?redirect=%s' %\
        (request.host, request.path)
    user_json['institutions'] = []
    for institution in user.institutions:
        user_json['institutions'].append(
            Utils.toJson(institution.get())
        )
    user_json['follows'] = [institution_key.get().make(
        ['acronym', 'photo_url', 'key', 'parent_institution']) for institution_key in user.follows]
    return user_json


def checkIsAdmin(method):
    """Method of check if user is admin of institution."""
    def params(self, user, request_key, *args):
        request = ndb.Key(urlsafe=request_key).get()
        institution = request.institution_key.get()

        Utils._assert(
            institution.admin != user.key,
            "User is not admin!",
            NotAuthorizedException)

        return method(self, user, request, *args)

    return params


class RequestHandler(BaseHandler):
    """Request Handler."""

    @login_required
    @checkIsAdmin
    @json_response
    def get(self, user, request):
        """Handler GET Requests."""
        self.response.write(json.dumps(request.make()))

    @login_required
    @json_response
    @checkIsAdmin
    @ndb.transactional(xg=True)
    def put(self, user, request):
        """Handler PUT Requests."""
        Utils._assert(
            request.status != 'sent',
            "this request has already been processed",
            EntityException)

        request.change_status('accepted')

        institution_key = request.institution_key
        user = request.sender_key.get()

        user.add_institution(institution_key)
        user.follow(institution_key)
        user.change_state('active')

        institution = institution_key.get()

        institution.add_member(user)
        institution.follow(user.key)

        self.response.write(json.dumps(makeUser(user, self.request)))

    @login_required
    @checkIsAdmin
    @json_response
    def delete(self, user, request):
        """Change request status from 'sent' to 'rejected'."""
        request.change_status('rejected')
        request.put()