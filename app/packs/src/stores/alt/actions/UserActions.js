import alt from 'src/stores/alt/alt';
import UsersFetcher from 'src/fetchers/UsersFetcher';
import SegmentsFetcher from 'src/fetchers/SegmentsFetcher';
import GenericDSsFetcher from 'src/fetchers/GenericDSsFetcher';

import DocumentHelper from 'src/utilities/DocumentHelper';

class UserActions {
  fetchOlsRxno() {
    return (dispatch) => {
      UsersFetcher.fetchOls('rxno')
        .then((result) => {
          dispatch(result);
        }).catch((errorMessage) => {
          console.log(errorMessage);
        });
    };
  }

  fetchOlsChmo() {
    return (dispatch) => {
      UsersFetcher.fetchOls('chmo')
        .then((result) => {
          dispatch(result);
        }).catch((errorMessage) => {
          console.log(errorMessage);
        });
    };
  }

  fetchCurrentUser() {
    return (dispatch) => {
      UsersFetcher.fetchCurrentUser()
        .then((result) => {
          dispatch(result.user);
        }).catch((errorMessage) => {
          console.log(errorMessage);
        });
    };
  }

  fetchGenericEls() {
    return (dispatch) => {
      UsersFetcher.fetchElementKlasses()
        .then((roots) => {
          dispatch(roots);
        }).catch((errorMessage) => {
          console.log(errorMessage);
        });
    };
  }


  logout() {
    fetch('/users/sign_out', {
      method: 'delete',
      credentials: 'same-origin',
      data: { authenticity_token: DocumentHelper.getMetaContent("csrf-token") }
    })
      .then(response => {
        if (response.status == 204) {
          location = '/home';
        }
      });
  }

  fetchProfile() {
    return (dispatch) => {
      UsersFetcher.fetchProfile()
        .then((result) => { dispatch(result); })
        .catch((errorMessage) => { console.log(errorMessage); });
    };
  }

  selectTab(tab) {
    return tab;
  }

  updateUserProfile(params) {
    return (dispatch) => {
      UsersFetcher.updateUserProfile(params)
        .then((result) => {
          dispatch(result);
        }).catch((errorMessage) => {
          console.log(errorMessage);
        });
    };
  }

  fetchUserLabels() {
    return (dispatch) => {
      UsersFetcher.listUserLabels(true)
        .then((result) => {
          dispatch(result);
        }).catch((errorMessage) => {
          console.log(errorMessage);
        });
    };
  }

  fetchEditors() {
    return (dispatch) => {
      UsersFetcher.listEditors()
        .then((result) => {
          dispatch(result);
        }).catch((errorMessage) => {
          console.log(errorMessage);
        });
    };
  }

  fetchNoVNCDevices() {
    return (dispatch) => {
      UsersFetcher.fetchNoVNCDevices()
        .then(result => { dispatch(result); })
        .catch((errorMessage) => { console.log(errorMessage); });
    };
  }

  fetchSegmentKlasses() {
    return (dispatch) => {
      SegmentsFetcher.fetchKlass()
        .then((result) => {
          dispatch(result);
        }).catch((errorMessage) => {
          console.log(errorMessage);
        });
    };
  }

  fetchDatasetKlasses() {
    return (dispatch) => {
      GenericDSsFetcher.fetchKlass()
        .then((result) => {
          dispatch(result);
        }).catch((errorMessage) => {
          console.log(errorMessage);
        });
    };
  }

  fetchUnitsSystem() {
    return (dispatch) => {
      fetch('/units_system/units_system.json', {
        credentials: 'same-origin',
        cache: 'no-store',
        headers: { 'cache-control': 'no-cache' }
      }).then(response => response.json()).then(json => dispatch(json)).catch((errorMessage) => {
        console.log(errorMessage);
      });
    }
  }

  fetchOmniauthProviders() {
    return (dispatch) => {
      UsersFetcher.fetchOmniauthProviders()
        .then((result) => { dispatch(result); })
        .catch((errorMessage) => { console.log(errorMessage); });
    }
  }
}

export default alt.createActions(UserActions);
