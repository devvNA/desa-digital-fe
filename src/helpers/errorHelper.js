export function handleError(error) {
  if (!error.response) {
    alert("Something went wrong. Please try again later.");
    return;
  }

  const { status, data } = error.response;

  if (status === 422) {
    return data.errors;
  }

  if ([400, 401, 500].includes(status)) {
    return data.message;
  }

  alert("Something went wrong. Please try again later.");
}
