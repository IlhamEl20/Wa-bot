const PhoneID = (phoneNumber) => {
  if (phoneNumber.startsWith("08")) {
    return "62" + phoneNumber.slice(1);
  }
  return phoneNumber;
};
export default PhoneID;
