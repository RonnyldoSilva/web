'use strict';
(function() {
    var app = angular.module('app');

    app.controller("SuggestInstitutionController", function SuggestInstitutionController(
        $mdDialog, institution, institutions, invite, requested_invites, isHierarchy, inviteController, $state,
        MessageService, InstitutionService){
        var suggestInstCtrl = this;
        suggestInstCtrl.institution = institution;
        suggestInstCtrl.institutions = institutions;
        suggestInstCtrl.invite = invite;
        suggestInstCtrl.chosen_institution = null;
        suggestInstCtrl.requested_invites = requested_invites;
        suggestInstCtrl.isHierarchy = isHierarchy;
        var ACTIVE_STATE = "active";
        var PENDING_STATE = "pending";

        suggestInstCtrl.goToInstitution = function goToInstitution(institutionKey) {
            const url = $state.href('app.institution', {institutionKey: institutionKey});
            window.open(url, '_blank');
        };

        suggestInstCtrl.cancel = function cancel() {
            $mdDialog.cancel();
        };

        suggestInstCtrl.showSuggestion = function showSuggestion(state) {
            return suggestInstCtrl.isActive(state) && suggestInstCtrl.isHierarchy;
        };

        suggestInstCtrl.suggestionToSimpleInvite = function suggestionToSimpleInvite(state) {
            return suggestInstCtrl.isPending(state) ||
                (suggestInstCtrl.isActive(state) && !suggestInstCtrl.isHierarchy);
        }

        suggestInstCtrl.isActive = function isActive(state) {
            return state === ACTIVE_STATE;
        };

        suggestInstCtrl.isPending = function isPending(state) {
            return state === PENDING_STATE;
        };

        suggestInstCtrl.checkAndSendInvite = function checkAndSendInvite() {
            if (suggestInstCtrl.chosen_institution) {
                sendInviteToExistingInst();
            } else {
                inviteController.sendInstInvite(invite).then(function() {
                    suggestInstCtrl.cancel();
                });
            }
        };

        suggestInstCtrl.titleMessage = function() {
            const oneInst = 'Já existe uma instituição com esse nome.';
            const moreThanOneInst = 'Já existem instituições com esse nome.';
            const question = ' Deseja convidar mesmo assim?';
            const selectMsg = 'instituição existente se deseja convidá-la ou selecione a opção de convidar uma nova instituição.'
            return suggestInstCtrl.institutions.length === 1 ?
                suggestInstCtrl.isHierarchy ? oneInst +
                ' Selecione a ' + selectMsg :
                oneInst + question : suggestInstCtrl.isHierarchy ?
                moreThanOneInst + ' Selecione uma ' + selectMsg :
                moreThanOneInst + question;
        };

        suggestInstCtrl.instStatusMessage = function instStatusMessage(admin, state) {
            return suggestInstCtrl.isPending(state) ?
                'Instituição pendente - convite enviado para: ' + admin : 'Instituição ativa'
        };

        function sendInviteToExistingInst() {
            InstitutionService.getInstitution(suggestInstCtrl.chosen_institution).then(function(response) {
                if (!(isLinked(response.data) || isSelf() || isPedingRequest() || isInvited())) {
                    invite.requested_inst_name = response.data.name;
                    inviteController.sendRequestToExistingInst(invite, suggestInstCtrl.chosen_institution).then(function() {
                        suggestInstCtrl.cancel();
                    });
                }
            });
        }

        function isLinked(institution_requested) {
            var isParent = _.includes(_.map(suggestInstCtrl.institution.children_institutions, getKeyFromInst), suggestInstCtrl.chosen_institution);
            var isChildren = (suggestInstCtrl.institution.parent_institution !== null &&
                    suggestInstCtrl.institution.parent_institution.key === suggestInstCtrl.chosen_institution);
            var selfIsParent = (institution_requested.parent_institution !== null &&
                    institution_requested.parent_institution.key === suggestInstCtrl.institution.key);
            var selfIsChildren = _.includes(_.map(institution_requested.children_institutions, getKeyFromInst), suggestInstCtrl.institution.key);
            if (isParent || isChildren || selfIsParent || selfIsChildren) {
                MessageService.showToast('As instituições já estão conectadas');
                return true;
            }
            return false;
        }

        function isPedingRequest() {
            if (_.includes(_.map(suggestInstCtrl.requested_invites, getInstKeyFromInvite), suggestInstCtrl.chosen_institution)) {
                MessageService.showToast('Esta instituição tem uma requisição de vínculo pendente. Aceite ou rejeite a requisição');
                return true;
            }
            return false;
        }

        function isSelf() {
            if (suggestInstCtrl.institution.key === suggestInstCtrl.chosen_institution) {
                MessageService.showToast('A instituição convidada não pode ser ela mesma');
                return true;
            }
            return false;
        }

        function isInvited() {
            var result = false;
            _.forEach(suggestInstCtrl.institution.sent_invitations, function(invite) {
                if ((invite.type_of_invite === "REQUEST_INSTITUTION_PARENT" || invite.type_of_invite === "REQUEST_INSTITUTION_CHILDREN") &&
                    invite.institution_requested_key === suggestInstCtrl.chosen_institution && invite.status === "sent") {
                    MessageService.showToast('Esta instituição já foi convidada e seu convite está pendente');
                    result = true;
                }
            });
            return result;
        }

        function getKeyFromInst(institution) {
            return institution.key;
        }

        function getInstKeyFromInvite(invite) {
            return invite.institution_key;
        }
    });
})();