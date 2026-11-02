# Local Ledger payroll profiles

JSON profiles in this directory contain private rates and monthly payment
exceptions. They are ignored by Git and are loaded by Ledger only on localhost,
`127.0.0.1`, and `*.local` hosts.

Keep one file per proofreader. Manual material decisions made in Ledger are
stored in the browser and can be downloaded as a JSON patch from the payment
panel.

Profiles may declare fixed blocks with visual `components`, rates for canonical
row buckets (`xtra_lr`, `xtra_sp`, `xtra_eg`, `duty_lr`, `duty_sunday`) and
adjustable sport/duty detection thresholds under `rules`. Sport, paired weekend
duty days and SMM are calculated from the selected proofreader's monthly rows;
fixed `periods[YYYYMM].blocks` remain available only for explicit exceptions.
