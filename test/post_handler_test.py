# -*- coding: utf-8 -*-
"""Post handler test."""

from test_base_handler import TestBaseHandler
from models.post import Post
from models.user import User
from models.institution import Institution
from models.post import Comment
from handlers.post_handler import PostHandler

from mock import patch


class PostHandlerTest(TestBaseHandler):
    """Test the post_handler class."""

    @classmethod
    def setUp(cls):
        """Provide the base for the tests."""
        super(PostHandlerTest, cls).setUp()
        methods = set(cls.webapp2.WSGIApplication.allowed_methods)
        methods.add('PATCH')
        cls.webapp2.WSGIApplication.allowed_methods = frozenset(methods)
        app = cls.webapp2.WSGIApplication(
            [("/api/posts/(.*)", PostHandler),
             ], debug=True)
        cls.testapp = cls.webtest.TestApp(app)
        initModels(cls)

    @patch('utils.verify_token', return_value={'email': 'mayzabeel@gmail.com'})
    def test_delete(self, verify_token):
        """Test the post_handler's delete method."""
        # test delete post when the post has a comment
        # Verify if before the delete the post's state is published
        self.assertEqual(self.mayza_post.state, 'published',
                         "The post's state must be published")
        self.mayza_post.add_comment(self.raoni_comment)
        self.testapp.delete("/api/posts/%s" % self.mayza_post.key.urlsafe())
        # Retrieve the post from the datastore, once it has been changed
        self.mayza_post = self.mayza_post.key.get()
        # Make sure the post's state is deleted
        self.assertEqual(self.mayza_post.state, 'deleted',
                         "The post's state must be deleted")

        # test delete post when the post has a like
        # Verify if before the delete the post's state is published
        self.assertEqual(self.mayza_other_post.state, 'published',
                         "The post's state must be published")
        self.mayza_other_post.like(self.raoni.key)
        self.testapp.delete("/api/posts/%s"
                            % self.mayza_other_post.key.urlsafe())
        # Retrieve the post from the datastore, once it has been changed
        self.mayza_other_post = self.mayza_other_post.key.get()
        # Make sure the post's state is deleted
        self.assertEqual(self.mayza_other_post.state, 'deleted',
                         "The post's state must be deleted")

        # Pretend an authentication
        verify_token.return_value = {'email': 'raoni.smaneoto@ccc.ufcg.edu.br'}

        # test delete post when the post has no activity
        # Verify if before the delete the post's state is published
        self.assertEqual(self.raoni_post.state, 'published',
                         "The post's state must be published")
        # Verify if certbio has only one post
        self.assertEqual(len(self.certbio.posts), 3,
                         "certbio should have only one post")
        # Call the delete method
        self.testapp.delete("/api/posts/%s" % self.raoni_post.key.urlsafe())
        # update certbio
        self.certbio = self.certbio.key.get()
        # Make sure the post was deleted from certbio
        self.assertEqual(len(self.certbio.posts), 2,
                         "certbio should have no posts")

    @patch('utils.verify_token', return_value={'email': 'mayzabeel@gmail.com'})
    def test_patch(self, verify_token):
        """Test the post_handler's patch method."""
        # Call the patch method and assert that  it raises an exception
        with self.assertRaises(Exception):
            self.testapp.patch_json("/api/posts/%s"
                                    % self.raoni_post.key.urlsafe(),
                                    [{"op": "replace", "path": "/text",
                                      "value": "testando"}]
                                    )
        # Call the patch method and assert that it works
        self.testapp.patch_json("/api/posts/%s"
                                % self.mayza_post.key.urlsafe(),
                                [{"op": "replace", "path": "/text",
                                    "value": "testando"}]
                                )
        self.mayza_post = self.mayza_post.key.get()
        self.assertEqual(self.mayza_post.text, "testando")
        # Pretend a new authentication
        verify_token.return_value = {'email': 'raoni.smaneoto@ccc.ufcg.edu.br'}

        # Call the patch method and assert that it works
        self.testapp.patch_json("/api/posts/%s"
                                % self.raoni_post.key.urlsafe(),
                                [{"op": "replace", "path": "/text",
                                    "value": "testando"}]
                                )
        self.raoni_post = self.raoni_post.key.get()
        self.assertEqual(self.raoni_post.text, "testando")
        # Call the patch method and assert that  it raises an exception
        with self.assertRaises(Exception):
            self.testapp.patch_json("/api/posts/%s"
                                    % self.mayza_post.key.urlsafe(),
                                    [{"op": "replace", "path": "/text",
                                      "value": "testando"}]
                                    )
        # test the case when the post has a like, so it can not be updated
        self.mayza_post.like(self.raoni.key)
        self.mayza_post = self.mayza_post.key.get()
        with self.assertRaises(Exception):
            self.testapp.patch_json("/api/posts/%s"
                                    % self.mayza_post.key.urlsafe(),
                                    [{"op": "replace", "path": "/text",
                                        "value": "testando"}]
                                    )

        # test the case when the post has a comment, so it can not be updated
        self.mayza_post.add_comment(self.raoni_comment)
        self.mayza_post = self.mayza_post.key.get()
        with self.assertRaises(Exception):
            self.testapp.patch_json("/api/posts/%s"
                                    % self.mayza_post.key.urlsafe(),
                                    [{"op": "replace", "path": "/text",
                                        "value": "testando"}]
                                    )

    def tearDown(cls):
        """Deactivate the test."""
        cls.test.deactivate()


def initModels(cls):
    """Init the models."""
    # new User Mayza
    cls.mayza = User()
    cls.mayza.name = 'Mayza Nunes'
    cls.mayza.cpf = '089.675.908-90'
    cls.mayza.email = 'mayzabeel@gmail.com'
    cls.mayza.put()

    # new User Raoni
    cls.raoni = User()
    cls.raoni.name = 'Raoni Smaneoto'
    cls.raoni.cpf = '089.675.908-65'
    cls.raoni.email = 'raoni.smaneoto@ccc.ufcg.edu.br'
    cls.raoni.put()

    # new Institution CERTBIO
    cls.certbio = Institution()
    cls.certbio.name = 'CERTBIO'
    cls.certbio.acronym = 'CERTBIO'
    cls.certbio.cnpj = '18.104.068/0001-86'
    cls.certbio.legal_nature = 'public'
    cls.certbio.address = 'Universidade Federal de Campina Grande'
    cls.certbio.occupation_area = ''
    cls.certbio.description = 'Ensaio Químico - Determinação de Material Volátil por \
            Gravimetria e Ensaio Biológico - Ensaio de Citotoxicidade'
    cls.certbio.email = 'certbio@ufcg.edu.br'
    cls.certbio.phone_number = '(83) 3322 4455'
    cls.certbio.members = [cls.mayza.key, cls.raoni.key]
    cls.certbio.followers = [cls.mayza.key, cls.raoni.key]
    cls.certbio.admin = cls.mayza.key
    cls.certbio.put()

    # POST of Mayza To Certbio Institution
    cls.mayza_post = Post()
    cls.mayza_post.title = "Novo edital do CERTBIO"
    cls.mayza_post.text = "At vero eos et accusamus et iusto odio dignissimos \
        ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti \
        quos dolores et quas molestias excepturi sint occaecati cupiditate \
        aut perferendis doloribus asperiores repellat."
    cls.mayza_post.author = cls.mayza.key
    cls.mayza_post.institution = cls.certbio.key
    cls.mayza_post.put()

    # POST of Mayza To Certbio Institution
    cls.mayza_other_post = Post()
    cls.mayza_other_post.title = "Outro edital do CERTBIO"
    cls.mayza_other_post.text = "Text"
    cls.mayza_other_post.author = cls.mayza.key
    cls.mayza_other_post.institution = cls.certbio.key
    cls.mayza_other_post.put()

    # Post of Raoni
    cls.raoni_post = Post()
    cls.raoni_post.title = "Novwdfsadsssdo edital do CERTBIO"
    cls.raoni_post.text = "At vero eos et accusamus et iusto odio dignissimos \
        ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti \
        delectus, ut aut reiciendis voluptatibus maiores alias consequatur \
        aut perferendis doloribus asperiores repellat."
    cls.raoni_post.author = cls.raoni.key
    cls.raoni_post.institution = cls.certbio.key
    cls.raoni_post.put()

    # update certbio's posts
    cls.certbio.posts = [cls.raoni_post.key, cls.mayza_post.key,
                         cls.mayza_other_post.key]
    cls.certbio.put()

    # comment
    data_comment = {"text": "hello",
                    "institution_key": cls.certbio.key.urlsafe()}
    cls.raoni_comment = Comment.create(data_comment,
                                       cls.raoni.key, cls.mayza_post.key)
    cls.raoni_comment.put()
