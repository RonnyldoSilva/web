'use strict';

(function () {
    const app = angular.module("app");
    
    app.controller("InstitutionLinksController", function InstitutionLinksController($state, InstitutionService, MessageService) {

        var instLinksCtrl = this;
        var currentInstitutionKey = $state.params.institutionKey;

        instLinksCtrl.isLoadingInsts = true;
        instLinksCtrl.currentInstitution = "";
        instLinksCtrl.parentInstitution = {};
        instLinksCtrl.childrenInstitutions = [];

        instLinksCtrl.goToInst = function goToInst(institutionKey) {
            const url = $state.href('app.institution.timeline', { institutionKey: institutionKey });
            window.open(url, '_blank');
        };

        instLinksCtrl.hasInstitutions = function hasInstitutions() {
            return !instLinksCtrl.isLoadingInsts
                && (instLinksCtrl.hasParentInst() || instLinksCtrl.hasChildrenInst());
        };

        instLinksCtrl.hasParentInst = function hasParentInst() {
            return !_.isEmpty(instLinksCtrl.parentInstitution);
        };

        instLinksCtrl.hasChildrenInst = function hasChildrenInst() {
            return !_.isEmpty(instLinksCtrl.childrenInstitutions);
        };

        function loadInstitution() {
            InstitutionService.getInstitution(currentInstitutionKey).then(function success(response) {
                var parentInstitution = response.data.parent_institution;
                instLinksCtrl.parentInstitution = parentInstitution && parentInstitution.state === "active" ? parentInstitution : {};
                instLinksCtrl.childrenInstitutions = response.data.children_institutions.filter(inst => inst.state === "active");
                instLinksCtrl.isLoadingInsts = false;
            }, function error(response) {
                instLinksCtrl.isLoadingInsts = true;
                MessageService.showToast(response.data.msg);
            });
        }

        loadInstitution();
    });
})();