'use strict';

(function () {
    const app = angular.module("app");

    app.controller('EventDialogController', function EventDialogController(MessageService, brCidadesEstados,
        ImageService, AuthService, EventService, $state, $rootScope, $mdDialog, $http, $q, ObserverRecorderService) {
        var dialogCtrl = this;

        dialogCtrl.loading = false;
        dialogCtrl.user = AuthService.getCurrentUser();
        dialogCtrl.deletePreviousImage = false;
        dialogCtrl.photoUrl = "";
        dialogCtrl.dateToChange = {};
        dialogCtrl.observer = {};
        dialogCtrl.videoUrls = [];
        dialogCtrl.usefulLinks = [];
        dialogCtrl.isAnotherCountry = false;
        dialogCtrl.steps = [true, false, false];
        dialogCtrl.now = Date.now();
        var emptyUrl = {
            url: '',
            description: ''
        };

        dialogCtrl.save = function save() {
            addLinks();
            var callback = dialogCtrl.isEditing ? updateEvent : create;
            var saveImgPromise = saveImage(callback);
        };

        dialogCtrl.removeUrl = function (url, urlList) {
            _.remove(urlList, function (element) {
                return element === url;
            });
        };

        dialogCtrl.changeUrlLink = function (urlLink, urlList) {
            urlLink.url ? dialogCtrl.addUrl(urlList) : urlList.length > 1 &&
                dialogCtrl.removeUrl(urlLink, urlList);
        };

        dialogCtrl.addUrl = function (urlList) {
            const hasEmptyUrl = dialogCtrl.getEmptyUrl(urlList) !== undefined;
            urlList.length < 10 && !hasEmptyUrl && urlList.push(angular.copy(emptyUrl));
        };

        dialogCtrl.getEmptyUrl = function (urlList) {
            return _.find(urlList, emptyUrl);
        };

        dialogCtrl.createInitDate = function createInitDate() {
            dialogCtrl.startTime = dialogCtrl.event.start_time && new Date(dialogCtrl.event.start_time);
        };

        function saveImage(callback) {
            if (dialogCtrl.photoBase64Data) {
                dialogCtrl.loading = true;
                ImageService.saveImage(dialogCtrl.photoBase64Data)
                    .then(function success(data) {
                        dialogCtrl.loading = false;
                        dialogCtrl.event.photo_url = data.url;
                        callback();
                    }, function error(response) {
                        MessageService.showToast(response.data.msg);
                    });
            } else {
                callback();
            }
        }

        function updateEvent() {
            var event = new Event(dialogCtrl.event, dialogCtrl.user.current_institution.key);
            if (event.isValid()) {
                dialogCtrl.loading = true;
                var patch = ObserverRecorderService.generate(dialogCtrl.observer);
                var formatedPatch = formatPatch(generatePatch(patch, event));
                EventService.editEvent(dialogCtrl.event.key, formatedPatch)
                    .then(function success() {
                        $mdDialog.hide(event);
                        MessageService.showToast('Evento editado com sucesso.');
                    }, function error(response) {
                        MessageService.showToast(response.data.msg);
                        $mdDialog.hide(event);
                    });
            } else {
                MessageService.showToast('Evento inválido');
            }
        }

        /*
        * This function remove the string '.000Z' added in end of properties start_time and end_time automatically by generatePatch.
        * @param {patch} - The patch list of properties that was changed.
        * @return {undefined} - Void function returns undefined.
        */
        function formatPatch(patch) {
            return patch.reduce((a, b) => {
                if (b.path === "/end_time" || b.path === "/start_time") {
                    b.value = b.value.split(".")[0];
                }
                a.push(b);
                return a;
            }, []);
        }

        dialogCtrl.changeDate = function changeDate(typeOfDate) {
            dialogCtrl.dateToChange[typeOfDate] = true;
        };

        dialogCtrl.addImage = function (image) {
            var newSize = 1024;

            ImageService.compress(image, newSize).then(function success(data) {
                dialogCtrl.photoBase64Data = data;
                ImageService.readFile(data, setImage);
                dialogCtrl.deletePreviousImage = true;
                dialogCtrl.file = null;
            }, function error(error) {
                MessageService.showToast(error);
            });
        };

        dialogCtrl.closeDialog = function closeDialog() {
            $mdDialog.hide();
        };

        dialogCtrl.showButtonSend = function () {
            var isTitleUndefined = dialogCtrl.event.title === undefined;
            var isLocalUndefined = dialogCtrl.event.local === undefined;
            var isDateStartUndefined = dialogCtrl.event.start_time === undefined;
            var isDateEndUndefined = dialogCtrl.event.end_time === undefined;
            return !isTitleUndefined && !isLocalUndefined &&
                !isDateStartUndefined && !isDateEndUndefined;
        };

        dialogCtrl.showImage = function () {
            var isImageEmpty = dialogCtrl.photoUrl === "";
            var isImageNull = dialogCtrl.photoUrl === null;
            return !isImageEmpty && !isImageNull;
        };

        dialogCtrl.showEventImage = function () {
            var isImageEmpty = dialogCtrl.event.photo_url === "";
            var isImageNull = dialogCtrl.event.photo_url === null;
            var isImageUndefined = dialogCtrl.event.photo_url === undefined;
            return !isImageEmpty && !isImageNull && !isImageUndefined && !dialogCtrl.showImage();
        };

        dialogCtrl.cleanImage = function () {
            dialogCtrl.photoUrl = "";
            dialogCtrl.photoBase64Data = null;
            dialogCtrl.deletePreviousImage = true;
            delete dialogCtrl.event.photo_url;
        };

        dialogCtrl.isEventOutdated = function isEventOutdated() {
            var endDate = new Date(dialogCtrl.event.end_time);
            var now = Date.now();
            return now > endDate;
        };

        dialogCtrl.getCitiesByState = function getCitiesByState() {
            dialogCtrl.cities = brCidadesEstados.buscarCidadesPorSigla(dialogCtrl.selectedFederalState.sigla);
            dialogCtrl.event.address.federal_state = dialogCtrl.selectedFederalState.nome;
        };

        dialogCtrl.setAnotherCountry = function setAnotherCountry() {
            clearSelectedState();
            dialogCtrl.isAnotherCountry = dialogCtrl.event.address.country !== "Brasil";
        };

        dialogCtrl.getStep = function getStep(step) {
            return dialogCtrl.steps[step - 1];
        };

        dialogCtrl.nextStep = function nextStep() {
            var currentStep = _.findIndex(dialogCtrl.steps, function (situation) {
                return situation;
            });
            if (isCurrentStepValid(currentStep)) {
                dialogCtrl.steps[currentStep] = false;
                var nextStep = currentStep + 1;
                dialogCtrl.steps[nextStep] = true;
            } else {
                MessageService.showToast("Preencha os campos obrigatórios corretamente.");
            }
        };

        dialogCtrl.isValidAddress = function isValidAddress() {
            var valid = true;
            var address = dialogCtrl.event.address;
            var attributes = ["street", "country", "federal_state", "city"];
            if (address && address.country === "Brasil") {
                _.forEach(attributes, function (attr) {
                    var value = _.get(dialogCtrl.event.address, attr);
                    if (!value || _.isUndefined(value) || _.isEmpty(value)) {
                        valid = false;
                    }
                });
            }
            return valid;
        };

        dialogCtrl.isValidDate = function isValidDate() {
            return !_.isUndefined(dialogCtrl.event.start_time) &&
                !_.isUndefined(dialogCtrl.event.end_time);
        };

        dialogCtrl.isValidStepOne = function isValidStepOne() {
            return dialogCtrl.isValidAddress() && dialogCtrl.isValidDate();
        };

        function getFields() {
            var necessaryFieldsForStep = {
                0: {
                    fields: [
                        dialogCtrl.event.title,
                        dialogCtrl.event.local,
                        dialogCtrl.event.address
                    ],
                    isValid: dialogCtrl.isValidStepOne
                }
            };
            return necessaryFieldsForStep;
        }

        function isCurrentStepValid(currentStep) {
            var necessaryFieldsForStep = getFields();
            var isValid = true;

            if (!_.isUndefined(necessaryFieldsForStep[currentStep])) {
                _.forEach(necessaryFieldsForStep[currentStep].fields, function (field) {
                    if (_.isUndefined(field) || _.isEmpty(field)) {
                        isValid = false;
                    }
                });

                var isValidFunction = necessaryFieldsForStep[currentStep].isValid ?
                    necessaryFieldsForStep[currentStep].isValid() : true;
                isValid = isValid && isValidFunction;

            }
            return isValid;
        }

        dialogCtrl.nextStepOrSave = function nextStepOrSave() {
            if (dialogCtrl.getStep(3)) {
                dialogCtrl.blockReturnButton = true;
                dialogCtrl.save();
            } else {
                dialogCtrl.nextStep();
            }
        }

        dialogCtrl.previousStep = function previousStep() {
            var currentStep = _.findIndex(dialogCtrl.steps, function (situation) {
                return situation;
            });
            dialogCtrl.steps[currentStep] = false;
            var nextStep = currentStep - 1;
            dialogCtrl.steps[nextStep] = true;
        };

        dialogCtrl.showGreenButton = function showGreenButton(step) {
            if (step === 2) {
                return dialogCtrl.getStep(2) || dialogCtrl.getStep(3);
            } else {
                return dialogCtrl.getStep(3);
            }
        };

        function clearSelectedState() {
            dialogCtrl.event.address.federal_state = "";
            dialogCtrl.selectedFederalState = "";
            dialogCtrl.event.address.city = "";
        }

        function loadFederalStates() {
            dialogCtrl.federalStates = brCidadesEstados.estados;
        }

        function generatePatch(patch, data) {
            if (dialogCtrl.dateToChange.startTime) {
                patch.push({ op: 'replace', path: "/start_time", value: data.start_time });
            }
            if (dialogCtrl.dateToChange.endTime) {
                patch.push({ op: 'replace', path: "/end_time", value: data.end_time });
            }
            return patch;
        }

        function setImage(image) {
            $rootScope.$apply(function () {
                dialogCtrl.photoUrl = image.src;
            });
        }

        function create() {
            var event = new Event(dialogCtrl.event, dialogCtrl.user.current_institution.key);
            if (event.isValid()) {
                dialogCtrl.loading = true;
                EventService.createEvent(event).then(function success(response) {
                    $mdDialog.hide();
                    dialogCtrl.events.push(response.data);
                    MessageService.showToast('Evento criado com sucesso!');
                    dialogCtrl.user.addPermissions(['edit_post', 'remove_post'], response.data.key);
                }, function error(response) {
                    dialogCtrl.loading = false;
                    dialogCtrl.blockReturnButton = false;
                    MessageService.showToast(response.data.msg);
                    $state.go("app.user.events");
                });
            } else {
                MessageService.showToast('Evento inválido!');
            }
        }

        function addLinks() {
            let videoUrls = dialogCtrl.videoUrls.filter(videoUrl => videoUrl.url !== '');
            let usefulLinks = dialogCtrl.usefulLinks.filter(usefulLink => usefulLink.url !== '');
            dialogCtrl.event.video_url = videoUrls;
            dialogCtrl.event.useful_links = usefulLinks;
        };

        function getCountries() {
            $http.get('app/institution/countries.json').then(function success(response) {
                dialogCtrl.countries = response.data;
            });
        }

        function initPatchObserver() {
            dialogCtrl.observer = ObserverRecorderService.register(dialogCtrl.event);
        }

        function loadEventDates() {
            dialogCtrl.event.start_time = new Date(dialogCtrl.event.start_time);
            dialogCtrl.event.end_time = new Date(dialogCtrl.event.end_time);
        }

        function loadSelectedState() {
            if (dialogCtrl.event.address.federal_state && !dialogCtrl.isAnotherCountry) {
                dialogCtrl.selectedFederalState = dialogCtrl.federalStates
                    .filter(federalState => federalState.nome === dialogCtrl.event.address.federal_state)
                    .reduce(federalState => federalState);
                dialogCtrl.getCitiesByState();
            } else {
                dialogCtrl.selectedFederalState = dialogCtrl.event.address.federal_state;
            }
        }

        function initUrlFields() {
            if (dialogCtrl.event) {
                dialogCtrl.videoUrls = dialogCtrl.event.video_url.concat([angular.copy(emptyUrl)]);
                dialogCtrl.usefulLinks = dialogCtrl.event.useful_links.concat([angular.copy(emptyUrl)]);
            } else {
                dialogCtrl.videoUrls = [angular.copy(emptyUrl)];
                dialogCtrl.usefulLinks = [angular.copy(emptyUrl)];
            }
        }

        (function main() {
            var address = { country: "Brasil" };
            getCountries();
            loadFederalStates();
            initUrlFields();
            if (dialogCtrl.event) {
                dialogCtrl.photoUrl = dialogCtrl.event.photo_url;
                dialogCtrl.isAnotherCountry = dialogCtrl.event.address.country !== "Brasil";
                loadSelectedState();
                loadEventDates();
                initPatchObserver();
            } else {
                dialogCtrl.event = { address: address };
            }
        })();
    });
})();