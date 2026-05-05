function padDatePart(value) {
  return String(value).padStart(2, '0');
}

export default function formatPasswordDate(timestamp) {
  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) {
    return 'Data indisponivel';
  }

  return `${padDatePart(date.getDate())}/${padDatePart(date.getMonth() + 1)}/${date.getFullYear()} ${padDatePart(date.getHours())}:${padDatePart(date.getMinutes())}`;
}
