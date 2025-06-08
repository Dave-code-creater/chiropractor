export const signUpValidator = {
  validate(data) {
    const required = ['email', 'password', 'first_name', 'last_name'];
    for (const field of required) {
      if (!data[field]) {
        return { error: { details: [{ message: `${field} is required` }] } };
      }
    }
    return { value: data };
  }
};

export const signInValidator = {
  validate(data) {
    const required = ['username', 'password'];
    for (const field of required) {
      if (!data[field]) {
        return { error: { details: [{ message: `${field} is required` }] } };
      }
    }
    return { value: data };
  }
};
