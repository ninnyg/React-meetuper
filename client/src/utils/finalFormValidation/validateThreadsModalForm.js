export const validateThreadsModalForm = (values) => {
  const errors = {};

  if (!values.title) {
    errors.title = "You need write some text, it's required !";
  }

  return errors;
};
