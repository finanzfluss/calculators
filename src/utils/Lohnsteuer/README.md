# How to Add a New Tax Year

This guide includes instructions on how to add a new tax year to the calculators. It uses _year 2024_ as a tangible example.

## Generating Lohnsteuer File

### Prerequisites: Set Up Environment

1. Clone the latest version of [the generator repository](https://github.com/jenner/LstGen) on your local machine.
2. Activate your virtual environment and install the package in editable mode:
   ```bash
   # Create a new virtual environment
   python3 -m venv venv
   # Activate the virtual environment
   source venv/bin/activate
   # Install the package in editable mode
   pip3 install -e .
   ```
3. Check if a `2024_1` entry is included in the file `lstgen/pap.py`. If not, add the corresponding entry to let the generator know about the new tax year including the new XML pseudo codes:
   ```python
   PAP_RESOURCES = OrderedDict((
       ('2024_1', PapResource(
           '/interface/2024Version1.xhtml',
           '/javax.faces.resource/daten/xmls/Lohnsteuer2024.xml.xhtml'
       )),
   ))
   ```
4. Finally, follow the instructions below.

We can't use the global `lstgen` command, as it may not be up-to-date with the latest tax year. Instead, we will use the local `lstgen` command from the cloned repository.

### Trigger Generator

After `lstgen` is installed, run the following command:

```bash
python3 -m lstgen -p 2024_1 -l javascript --class-name Lohnsteuer2024 --outfile Lohnsteuer2024.js
```

A new file `Lohnsteuer2024.js` will be created in the current directory.

### Preprocess generated file

Now, edit the generated file and prepend the following lines at the top, replacing the existing function declaration:

```ts
// eslint-disable-next-line ts/ban-ts-comment
// @ts-nocheck

import { BigDecimal } from './shims/BigDecimal'

export function Lohnsteuer2024(params = {}) {}
```

Also, delete the `module.exports` declaration at the end of the file.

Then, copy the generated file `Lohnsteuer2024.js` as `Lohnsteuer2024.ts` into the current directory.

## Insert Into Handler Logic

Adjust `src/utils/Lohnsteuer/index.ts` by editing as follows.

First, add the import of the recently created file:

```ts
import { Lohnsteuer2024 } from './2024'
```

Then, add a new entry to the `INCOME_TAX_CLASSES` object map:

```ts
export const INCOME_TAX_CLASSES = {
  // ...
  2024: Lohnsteuer2024 as unknown as LohnsteuerInstance,
} as const
```

Lastly, adjust the `inputAccountingYear` enum in the schema of `src/calculators/gross-to-net.ts`.

Done! The calculator can now be called with new tax year as input.
