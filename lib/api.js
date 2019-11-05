import fetch from 'cross-fetch';
import { isValidEmail, getWebsiteUrl } from './utils';
import { getFromLocalStorage, LOCAL_STORAGE_KEYS } from './local-storage';

// Webpack error: Cannot find module 'webpack/lib/RequestShortener'
// import queryString from 'query-string';

export const queryString = params => {
  return Object.keys(params)
    .map(k => `${k}=${encodeURIComponent(params[k])}`)
    .join('&');
};

/**
 * The Promise returned from fetch() won't reject on HTTP error status. We
 * need to throw an error ourselves.
 */
export function checkResponseStatus(response) {
  const { status } = response;
  if (status >= 200 && status < 300) {
    return response.json();
  } else {
    return response.json().then(json => {
      const error = new Error(json.error ? json.error.message : json.code);
      error.json = json;
      error.response = response;
      throw error;
    });
  }
}

function addAuthTokenToHeader(obj = {}) {
  const accessToken = getFromLocalStorage(LOCAL_STORAGE_KEYS.ACCESS_TOKEN);
  if (!accessToken) {
    return obj;
  }
  return {
    Authorization: `Bearer ${accessToken}`,
    ...obj,
  };
}

export function upload(file) {
  const reader = new FileReader();
  reader.readAsDataURL(file);
  const formData = new FormData();
  formData.append('file', file);
  return fetch('/api/images', {
    method: 'post',
    headers: addAuthTokenToHeader(),
    body: formData,
  })
    .then(checkResponseStatus)
    .then(json => {
      return json.url;
    });
}

/**
 * Similar to `upload` but uses XHR, which gives us the ability
 * to watch for upload progress (not yet supported by fetch).
 *
 * @param `onProgress` - function called with upload progress as a number [0-100]
 */
export async function uploadImageWithXHR(file, onProgress) {
  // Get file content into FileData
  const reader = new FileReader();
  reader.readAsDataURL(file);
  const formData = new FormData();
  formData.append('file', file);
  formData.append('Content-Type', file.type);

  // Build request
  const xhr = new XMLHttpRequest();
  xhr.open('POST', '/api/images', true);
  xhr.setRequestHeader('Authorization', addAuthTokenToHeader().Authorization);

  if (onProgress) {
    xhr.upload.onprogress = event => {
      onProgress((event.loaded / event.total) * 100);
    };
  }

  xhr.onload = () => {
    if (xhr.status >= 200 && xhr.status < 300) {
      return xhr.responseText;
    } else {
      throw new Error('Upload failed');
    }
  };

  return xhr.send(formData);
}

export function connectAccount(CollectiveId, service, options = {}) {
  const params = {
    redirect: options.redirect || window.location.href.replace(/\?.*/, ''),
    CollectiveId,
    ...options,
  };

  return fetch(`/api/connected-accounts/${service}/oauthUrl?${queryString(params)}`, {
    method: 'get',
    headers: addAuthTokenToHeader(),
  }).then(checkResponseStatus);
}

export function disconnectAccount(collectiveId, service) {
  return fetch(`/api/connected-accounts/${service}/disconnect/${collectiveId}`, {
    method: 'delete',
    headers: addAuthTokenToHeader(),
  }).then(checkResponseStatus);
}

export async function getAccountClientToken(CollectiveId, service) {
  const params = { CollectiveId };
  const url = `/api/connected-accounts/${service}/clientToken?${queryString(params)}`;
  return checkResponseStatus(
    await fetch(url, {
      method: 'get',
      headers: addAuthTokenToHeader(),
    }),
  );
}

export function checkUserExistence(email) {
  if (!isValidEmail(email)) return Promise.resolve(false);
  return fetch(`/api/users/exists?email=${encodeURIComponent(email)}`)
    .then(checkResponseStatus)
    .then(json => Boolean(json.exists));
}

export function getFxRate(fromCurrency, toCurrency, date = 'latest') {
  return fetch(`/api/fxrate/${fromCurrency}/${toCurrency}/${date}`)
    .then(checkResponseStatus)
    .then(json => Number(json.fxrate));
}

/**
 * Old api
 * Expecting order = { name, email, totalAmount, description, privateMessage }
 */
export function addFunds(CollectiveId, order) {
  return fetch(`/api/groups/${CollectiveId}/donations/manual`, {
    method: 'POST',
    headers: {
      ...addAuthTokenToHeader(),
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ order }),
  }).then(checkResponseStatus);
}

export function signin(user, redirect) {
  const websiteUrl = getWebsiteUrl();
  return fetch('/api/users/signin', {
    method: 'POST',
    headers: {
      ...addAuthTokenToHeader(),
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ user, redirect, websiteUrl }),
  }).then(checkResponseStatus);
}

export async function refreshToken(currentToken) {
  const response = await fetch('/api/users/update-token', {
    method: 'POST',
    headers: { Authorization: `Bearer ${currentToken}` },
  });
  try {
    return await response.json();
  } catch (error) {
    return { error: response.statusText };
  }
}

/**
 * Fetch the given file from `path`. Must be a local path, otherwise
 * `options.allowExternal` must be explicitely set. You should be **extremely**
 * careful when using this as an attacker abusing from this option could
 * be able to fetch arbitrary files to our servers.
 *
 * @param options {Object}
 *  - format {string} Format of the file to get (currently supports csv and blob)
 *  - allowExtenal {string} An external URL from which get is allowed to fetch
 */
export function get(path, options = {}) {
  const { allowExternal, format } = options;
  const isAbsolute = path.substr(0, 1) === '/';
  if (!isAbsolute && (!allowExternal || !path.startsWith(allowExternal))) {
    throw new Error('Can only get resources with a relative path');
  }

  return fetch(path, {
    method: 'get',
    headers: addAuthTokenToHeader(),
  }).then(response => {
    if (format === 'csv') return response.text();
    if (format === 'blob') return response.blob();
    return checkResponseStatus(response);
  });
}

export function getGithubRepos(token) {
  return fetch(`/api/github-repositories?access_token=${token}`).then(checkResponseStatus);
}
