"""Survey Post Model."""
from models.post import Post
from google.appengine.ext import ndb
from utils import Utils
import datetime

@ndb.transactional(retries=10)
def update_vote(survey_key, user, option_id):
    """Add a vote to the survey post."""
    survey = survey_key.get()
    option = survey.options[option_id]

    option["number_votes"] += 1
    option["voters"].append(user)
    survey.number_votes += 1
    survey.options[option_id] = Utils.toJson(option)
    survey.put()

    return survey

class SurveyPost(Post):
    """Model of survey post."""

    options = ndb.JsonProperty()

    number_votes = ndb.IntegerProperty()

    # Type of survey.
    type_survey = ndb.StringProperty(choices=set([
        'multiple_choice',
        'binary']))

    # Date and time limit that survey will receive answers
    deadline = ndb.DateTimeProperty()

    @staticmethod
    def create(data, author_key, institution_key):
        """Create a post and check required fields."""
        survey_post = SurveyPost()
        survey_post.type_survey = data.get("type_survey")
        survey_post.options = Utils.toJson(data.get("options"))
        survey_post.number_votes = 0
        survey_post.deadline = datetime.datetime.strptime(
            data.get('deadline'), "%Y-%m-%dT%H:%M:%S") if data.get('deadline') else None

        survey_post = super(SurveyPost, survey_post).create(
            data, author_key, institution_key)
        return survey_post

    def remove_vote(self, author, option_id):
        """Remove a vote from survey post."""
        option = self.key.get().options[option_id]

        if(author not in option["voters"]):
            raise Exception("The user didn't vote for this option")

        option["number_votes"] -= 1
        option["voters"].remove(author)

        self.options[option_id] = Utils.toJson(option)
        self.put()

    def is_vote_valid(self, author, option):
        """Verify if vote is valid."""
        if(self.deadline and datetime.datetime.now() > self.deadline):
            raise Exception("Deadline for receive answers has passed.")

        if(author in option["voters"]):
            raise Exception("The user already voted for this option")

        return True

    def vote(self, author, all_options_selected):
        """Added all votes of user from survey post."""
        if(self.type_survey == "binary" and
            len(all_options_selected) == 1 and
            self.is_vote_valid(author, all_options_selected[0])):
           update_vote(self.key, author, all_options_selected[0]["id"])
        else:
            for option in all_options_selected:
                if(self.is_vote_valid(author, option)):
                    update_vote(self.key, author, option["id"])

    def make(post, host):
        """Create personalized json of post."""
        post_dict = super(SurveyPost, post).make(host)
        post_dict["number_votes"] = post.number_votes
        post_dict["deadline"] = post.deadline.isoformat(
        ) if post.deadline else ''
        post_dict["type_survey"] = post.type_survey
        post_dict["options"] = post.options if post.options else []

        return post_dict
