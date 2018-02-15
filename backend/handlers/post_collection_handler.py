# -*- coding: utf-8 -*-
"""Post  Collection Handler."""

from google.appengine.ext import ndb
import json
from utils import Utils
from utils import login_required
from utils import json_response

from handlers.base_handler import BaseHandler
from models.post import Post
from models.factory_post import PostFactory
from service_messages import send_message_notification
from service_entities import enqueue_task

from custom_exceptions.notAuthorizedException import NotAuthorizedException


def get_permission(data):
        """Return permission according to the type of data."""
        if(PostFactory.get_type(data) == 'SURVEY_POST'):
            return 'publish_survey'
        else:
            return 'publish_post'


class PostCollectionHandler(BaseHandler):
    """Post  Collection Handler."""

    @json_response
    @login_required
    def get(self, user):
        """Handle GET Requests."""
        posts = Utils.toJson(user.posts, host=self.request.host)
        self.response.write(json.dumps(posts))

    @json_response
    @login_required
    @ndb.toplevel
    def post(self, user):
        """Handle POST Requests."""
        body = json.loads(self.request.body)
        post_data = body['post']
        institution_key = post_data['institution']

        institution = ndb.Key(urlsafe=institution_key).get()

        Utils._assert(institution.state == 'inactive',
                      "The institution has been deleted",
                      NotAuthorizedException)

        permission = get_permission(post_data)

        user.key.get().check_permission(permission,
                              "You don't have permission to publish post.",
                              institution_key)
        post = PostFactory.create(post_data, user.key, institution.key)
        
        user.add_permissions_async(["edit_post", "remove_post"], post.key.urlsafe())

        institution.add_post(post)

        user.add_post(post)

        entity_type = PostFactory.get_type(post_data)

        for follower in institution.followers:
            if follower != user.key:
                send_message_notification(
                    follower.urlsafe(),
                    user.key.urlsafe(),
                    entity_type,
                    post.key.urlsafe(),
                    user.current_institution
                )

        if(post.shared_post):
            entity_type = 'SHARED_POST'
            params = {
                'receiver_key': post.author.urlsafe(),
                'sender_key': user.key.urlsafe(),
                'entity_key': post.key.urlsafe(),
                'entity_type': entity_type,
                'current_institution': user.current_institution.urlsafe()
            }

            enqueue_task('post-notification', params)

        self.response.write(json.dumps(post.make(self.request.host)))
