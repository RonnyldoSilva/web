# -*- coding: utf-8 -*-
"""Post Handler."""

from google.appengine.ext import ndb
import json
from utils import Utils
from utils import login_required
from utils import json_response
from utils import is_institution_member

from handlers.base_handler import BaseHandler
from models.post import Post


class PostHandler(BaseHandler):
    """Post Handler."""

    @json_response
    @login_required
    def get(self, user):
        """Handle GET Requests."""
        posts = Utils.toJson(user.posts, host=self.request.host)
        self.response.write(json.dumps(posts))

    @json_response
    @login_required
    @is_institution_member
    @ndb.transactional(xg=True)
    def post(self, user, institution):
        """Handle POST Requests."""
        data = json.loads(self.request.body)
        try:
            post = Post.create(data, user.key, institution.key)
            post.put()

            """ Update Institution."""
            institution.posts.append(post.key)
            institution.put()

            """ Update User."""
            user.posts.append(post.key)
            user.put()

            self.response.write(json.dumps(Post.make(post)))
        except Exception as error:
            self.response.set_status(Utils.BAD_REQUEST)
            self.response.write(Utils.getJSONError(
                Utils.BAD_REQUEST, error.message))