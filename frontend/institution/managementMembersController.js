'use strict';
(function() {
    var app = angular.module('app');

    app.controller("ManagementMembersController", function InviteUserController(
        InviteService, $mdToast, $state, $mdDialog, InstitutionService, AuthService, MessageService,
        RequestInvitationService, ProfileService) {
        var manageMemberCtrl = this;

        manageMemberCtrl.invite = {};
        manageMemberCtrl.sent_invitations = [];
        manageMemberCtrl.currentMember = "";

        manageMemberCtrl.showSendInvite = true;
        manageMemberCtrl.showInvites = false;
        manageMemberCtrl.showRequests = false;
        manageMemberCtrl.showMembers = false;

        var currentInstitutionKey = $state.params.institutionKey;
        var invite;

        manageMemberCtrl.user = AuthService.getCurrentUser();

        manageMemberCtrl.openRemoveMemberDialog = function openRemoveMemberDialog(ev, member_obj) {
             $mdDialog.show({
                templateUrl: 'app/institution/removeMemberDialog.html',
                controller: RemoveMemberController,
                controllerAs: "removeMemberCtrl",
                locals: {
                    member_obj: member_obj,
                },
                targetEvent: ev,
                clickOutsideToClose: true
            });
        };

        manageMemberCtrl.removeMember = function removeMember(member_obj) {
            _.remove(manageMemberCtrl.members, function(member) {
                return member.key === member_obj.key;
            });
            MessageService.showToast("Membro removido com sucesso.");
        };

        manageMemberCtrl.showUserProfile = function showUserProfile(userKey, ev) {
            ProfileService.showProfile(userKey, ev);
        };

        manageMemberCtrl.sendUserInvite = function sendInvite() {
            manageMemberCtrl.invite.institution_key = currentInstitutionKey;
            manageMemberCtrl.invite.admin_key = manageMemberCtrl.user.key;
            manageMemberCtrl.invite.type_of_invite = 'USER';
            invite = new Invite(manageMemberCtrl.invite);
            invite.sender_name = manageMemberCtrl.user.name;

            if (manageMemberCtrl.isUserInviteValid(invite)) {
                var promise = InviteService.sendInvite(invite);
                promise.then(function success() {
                    manageMemberCtrl.sent_invitations.push(invite);
                    manageMemberCtrl.invite = {};
                    MessageService.showToast('Convite enviado com sucesso!');
                }, function error(response) {
                    MessageService.showToast(response.data.msg);
                });
                return promise;
            }
        };

        manageMemberCtrl.acceptRequest = function acceptRequest(request) {
            var promise = RequestInvitationService.acceptRequest(request.key);

            promise.then(function success(response) {
                manageMemberCtrl.members.push(response);
                request.status = 'accepted';
                MessageService.showToast("Pedido aceito!");
            });
            return promise;
        };

        manageMemberCtrl.rejectRequest = function rejectInvite(request, event){
                var promise = RequestInvitationService.showRejectDialog(event);
                promise.then(function() {
                    deleteRequest(request);
                }, function() {
                    MessageService.showToast('Rejeição de pedido cancelada!');
                });
                return promise;
        };

        function deleteRequest(request) {
            var promise = RequestInvitationService.rejectRequest(request.key);
            promise.then(function success() {
                removeRejectedRequest(request);
                MessageService.showToast("O pedido foi rejeitado!");
            }, function error(response) {
                MessageService.showToast(response.data.msg);
            });
            return promise;
        }

        function removeRejectedRequest(request) {
            request.status = 'rejected';
            manageMemberCtrl.requests = manageMemberCtrl.requests.filter(function(req) {
                return req.key !== request.key;
            });
            manageMemberCtrl.showRequests = manageMemberCtrl.requests.length > 0;
        }

        manageMemberCtrl.cancelInvite = function cancelInvite() {
            manageMemberCtrl.invite = {};
        };

        manageMemberCtrl.isAdmin = function isAdmin(member) {
            return member.key === manageMemberCtrl.user.key;
        };

        function loadInstitution() {
            InstitutionService.getInstitution(currentInstitutionKey).then(function success(response) {
                getSentInvitations(response.data.sent_invitations);
                getMembers();
                getRequests();
            }, function error(response) {
                $state.go('app.institution', {institutionKey: currentInstitutionKey});
                MessageService.showToast(response.data.msg);
            });
        }

        function getSentInvitations(invitations) {
            var isUserInvitation = createRequestSelector('sent', 'USER');
            manageMemberCtrl.sent_invitations = invitations.filter(isUserInvitation);
        }

        function getMembers() {
            InstitutionService.getMembers(currentInstitutionKey).then(function success(response) {
                manageMemberCtrl.members = response.data;
            }, function error(response) {
                MessageService.showToast(response.data.msg);
            });
        }

        function getRequests() {
            RequestInvitationService.getRequests(currentInstitutionKey).then(function success(response) {
                var isUserRequest = createRequestSelector('sent', 'REQUEST_USER');
                manageMemberCtrl.requests = response.filter(isUserRequest);
            });
        }

        function getEmail(user) {
            return user.email;
        }

        function inviteeIsMember(invite) {
            return _.find(_.map(manageMemberCtrl.members, getEmail), function(emails) {
                return _.includes(emails, invite.invitee);
            });
        }

        function inviteeIsInvited(invite) {
            return _.find(manageMemberCtrl.sent_invitations, function(sentInvitation) {
                return sentInvitation.invitee === invite.invitee;
            });
        }

        manageMemberCtrl.showHideInvites = function showHideInvites() {
            manageMemberCtrl.showInvites = !manageMemberCtrl.showInvites;
        };

        manageMemberCtrl.showHideRequests = function showHideRequests() {
            manageMemberCtrl.showRequests = !manageMemberCtrl.showRequests;
        };

        manageMemberCtrl.showHideMembers = function showHideMembers() {
            manageMemberCtrl.showMembers = !manageMemberCtrl.showMembers;
        };

        manageMemberCtrl.showHideSendInvites = function showHideSendInvites() {
            manageMemberCtrl.showSendInvite = !manageMemberCtrl.showSendInvite;
        };

        manageMemberCtrl.isUserInviteValid = function isUserInviteValid(invite) {
            var isValid = true;
            if (! invite.isValid()) {
                isValid = false;
                MessageService.showToast('Convite inválido!');
            } else if (inviteeIsMember(invite)) {
                isValid = false;
                MessageService.showToast('O convidado já é um membro!');
            } else if (inviteeIsInvited(invite)) {
                isValid = false;
                MessageService.showToast('Este email já foi convidado');
            }
            return isValid;
        };

        manageMemberCtrl.calcHeight = function calcHeight(list=[], itemHeight=4.5) {
            var maxRequestsNumber = 4;
            var maxHeight = itemHeight * maxRequestsNumber + 'em';
            var actualHeight = list.length * itemHeight + 'em';
            var calculedHeight = list.length < maxRequestsNumber ? actualHeight : maxHeight;
            return {height: calculedHeight};
        };

        function createRequestSelector(status, type_of_invite) {
            return function(request) {
                return request.status === status && request.type_of_invite === type_of_invite;
            }
        }

        function RemoveMemberController(member_obj) {
            var removeMemberCtrl = this;
            
            removeMemberCtrl.justification = "";
            
            removeMemberCtrl.removeMember = function removeMember() {
                InstitutionService.removeMember(currentInstitutionKey, member_obj, removeMemberCtrl.justification).then(function success() {
                    manageMemberCtrl.removeMember(member_obj);
                    $mdDialog.cancel();
                }, function error(response) {
                    MessageService.showToast(response.data.msg);
                });
            };
            
            removeMemberCtrl.cancel = function cancel() {
                $mdDialog.cancel();
            };
        }
        
        loadInstitution();
    });
})();