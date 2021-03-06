try:
    from functools import lru_cache
except ImportError:
    from functools32 import lru_cache

import httplib2
import json
import datetime

from oauth2client.client import GoogleCredentials

from firebase_config import FIREBASE_URL

_FIREBASE_SCOPES = [
    'https://www.googleapis.com/auth/firebase.database',
    'https://www.googleapis.com/auth/userinfo.email']


@lru_cache()
def _get_http():
    """Provides an authed http object."""
    http = httplib2.Http()
    creds = GoogleCredentials.get_application_default().create_scoped(
        _FIREBASE_SCOPES)
    creds.authorize(http)
    return http

def firebase_post(path, value=None):
    """Add an object to an existing list of data.
    An HTTP POST allows an object to be added to an existing list of data.
    A successful request will be indicated by a 200 OK HTTP status code. The
    response content will contain a new attribute "name" which is the key for
    the child added.
    Args:
        path - the url to the Firebase list to append to.
        value - a json string.
    """
    response, content = _get_http().request(path, method='POST', body=value)
    return json.loads(content)

def send_notification(user, message, entity_type, entity):
    url = '{}/notifications/{}.json'.format(FIREBASE_URL, user)
    message['status'] = 'NEW'
    message['timestamp'] = datetime.datetime.now().isoformat()
    message['entity_type'] = entity_type
    message['entity'] = entity
    firebase_post(url, value=json.dumps(message))
