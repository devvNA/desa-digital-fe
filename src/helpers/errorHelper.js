export function handleError(error) {
  if (!error.response) {
    alert("Something went wrong. Please try again later.");
    return;
  }

  const { status, data } = error.response;
  const message = data?.message ?? "";

  if (
    typeof message === "string" &&
    message.includes("SQLSTATE[22003]") &&
    message.includes("column 'amount'")
  ) {
    return {
      amount: ["Nominal bantuan terlalu besar. Masukkan jumlah yang lebih kecil."],
    };
  }

  if (status === 422) {
    return data.errors;
  }

  if ([400, 401, 500].includes(status)) {
    return message;
  }

  alert("Something went wrong. Please try again later.");
}
