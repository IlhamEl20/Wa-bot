import time

alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
message_upper = "HAPPY BIRTHDAY TIKS".upper()

for i in range(len(message_upper) + 1):
    for j in range(len(alphabet)):
        if i == len(message_upper):
            break
        prefix = alphabet[j]
        current_str = prefix + message_upper[:i+1]
        print(current_str)
        time.sleep(0.04)
print(message_upper)
time.sleep(0.04)