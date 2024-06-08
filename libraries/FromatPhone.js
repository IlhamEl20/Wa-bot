const PhoneID = (phoneNumber) => {
  if (phoneNumber.startsWith("08")) {
    return "62" + phoneNumber.slice(1);
  }
  return phoneNumber;
};

export default PhoneID;

// export const ProcessPhoneNumbers = (data) => {
//   return data.map((item) => {
//     const processedNumbers = item.number.map(PhoneID);
//     return {
//       ...item,
//       number: processedNumbers,
//     };
//   });
// };
