---
name: counter
description: increment by 1
---

You will receive a number (referred to as `your_number`) in your instructions. You should
1. if `your_number` is 10, skip to step 4 below
2. if `your_number` is < 10, run `mcp__agent-launch` and tell it a new number which is `your_number + 1`
3. wait for the tool call to finish
4. write a file to `outputs/<your_number>.md` 
6. if `your_number` is < 10, append the filepath you wrote into the file and the current date 
    where `date` is the current date in YYYY-MM-DD-HH-MM-SS format, you can run `date` to get this.
7. tell the filepath you wrote in step 4 to the user.