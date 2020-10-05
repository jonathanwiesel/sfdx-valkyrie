[![version](https://img.shields.io/npm/v/sfdx-valkyrie.svg)]()

sfdx-valkyrie
====

This plugin aims to enforce the implementation of the bypassing pattern.

As mentioned in the "[Success Cloud Coding Coventions][1]" Trailhead:

> Bypass patterns: Configurations like validation rules, workflow rules, triggers, and process builders are necessary, but sometimes they get in your way (when you're loading large amounts of data or trying to debug a pesky error, for example). Bypass patterns use hierarchical custom settings or custom permissions to temporarily disable these configurations on the level of a user, profile, or org. Because both hierarchical custom settings and custom permissions are supported in formula fields, you can read their values in your validation rules, triggers, and process builders.

Valkyrie will report on bypass implementation not enforced in the following metadata types:

* Process builder (decision nodes)
* Validation rules 
* Workflow rules

[1]: https://trailhead.salesforce.com/content/learn/modules/success-cloud-coding-conventions/implement-frameworks-sc

# Usage
<!-- usage -->
```sh-session
$ sfdx plugins:install sfdx-valkyrie
$ sfdx COMMAND
running command...
$ sfdx (-v|--version|version)
sfdx-valkyrie/1.0.0 darwin-x64 node-v14.1.0
$ sfdx --help [COMMAND]
USAGE
  $ sfdx COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [`sfdx vlk:bypasser:process -n <string> [-o <string>] [-u <string>] [--apiversion <string>] [--json] [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]`](#sfdx-vlkbypasserprocess--n-string--o-string--u-string---apiversion-string---json---loglevel-tracedebuginfowarnerrorfataltracedebuginfowarnerrorfatal)
* [`sfdx vlk:bypasser:validrules -n <string> [-o <string>] [-u <string>] [--apiversion <string>] [--json] [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]`](#sfdx-vlkbypasservalidrules--n-string--o-string--u-string---apiversion-string---json---loglevel-tracedebuginfowarnerrorfataltracedebuginfowarnerrorfatal)
* [`sfdx vlk:bypasser:workflows -n <string> [-o <string>] [-u <string>] [--apiversion <string>] [--json] [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]`](#sfdx-vlkbypasserworkflows--n-string--o-string--u-string---apiversion-string---json---loglevel-tracedebuginfowarnerrorfataltracedebuginfowarnerrorfatal)

## `sfdx vlk:bypasser:process -n <string> [-o <string>] [-u <string>] [--apiversion <string>] [--json] [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]`

Scan for bypassers in processes

```
USAGE
  $ sfdx vlk:bypasser:process -n <string> [-o <string>] [-u <string>] [--apiversion <string>] [--json] [--loglevel 
  trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]

OPTIONS
  -n, --name=name                                                                   (required) specify the bypasser's
                                                                                    custom setting object API name to
                                                                                    search

  -o, --objects=objects                                                             search in specified objects.
                                                                                    Separate by comma if many

  -u, --targetusername=targetusername                                               username or alias for the target
                                                                                    org; overrides default target org

  --apiversion=apiversion                                                           override the api version used for
                                                                                    api requests made by this command

  --json                                                                            format output as json

  --loglevel=(trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL)  [default: warn] logging level for
                                                                                    this command invocation

EXAMPLE

           sfdx vlk:bypasser:process -u someOrg
           sfdx vlk:bypasser:process -u someOrg -o Account,Contact
           sfdx vlk:bypasser:process -u someOrg -n Bypasser_API_Name__c
```

_See code: [lib/commands/vlk/bypasser/process.js](https://github.com/jonathanwiesel/sfdx-valkyrie/blob/v1.0.0/lib/commands/vlk/bypasser/process.js)_

## `sfdx vlk:bypasser:validrules -n <string> [-o <string>] [-u <string>] [--apiversion <string>] [--json] [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]`

Scan for bypassers in validation rules

```
USAGE
  $ sfdx vlk:bypasser:validrules -n <string> [-o <string>] [-u <string>] [--apiversion <string>] [--json] [--loglevel 
  trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]

OPTIONS
  -n, --name=name                                                                   (required) specify the bypasser's
                                                                                    custom setting object API name to
                                                                                    search

  -o, --objects=objects                                                             search in specified objects.
                                                                                    Separate by comma if many

  -u, --targetusername=targetusername                                               username or alias for the target
                                                                                    org; overrides default target org

  --apiversion=apiversion                                                           override the api version used for
                                                                                    api requests made by this command

  --json                                                                            format output as json

  --loglevel=(trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL)  [default: warn] logging level for
                                                                                    this command invocation

EXAMPLE

           sfdx vlk:bypasser:validrules -u someOrg
           sfdx vlk:bypasser:validrules -u someOrg -o Account,Contact
           sfdx vlk:bypasser:validrules -u someOrg -n Bypasser_API_Name__c
```

_See code: [lib/commands/vlk/bypasser/validrules.js](https://github.com/jonathanwiesel/sfdx-valkyrie/blob/v1.0.0/lib/commands/vlk/bypasser/validrules.js)_

## `sfdx vlk:bypasser:workflows -n <string> [-o <string>] [-u <string>] [--apiversion <string>] [--json] [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]`

Scan for bypassers in workflow rules

```
USAGE
  $ sfdx vlk:bypasser:workflows -n <string> [-o <string>] [-u <string>] [--apiversion <string>] [--json] [--loglevel 
  trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]

OPTIONS
  -n, --name=name                                                                   (required) specify the bypasser's
                                                                                    custom setting object API name to
                                                                                    search

  -o, --objects=objects                                                             search in specified objects.
                                                                                    Separate by comma if many

  -u, --targetusername=targetusername                                               username or alias for the target
                                                                                    org; overrides default target org

  --apiversion=apiversion                                                           override the api version used for
                                                                                    api requests made by this command

  --json                                                                            format output as json

  --loglevel=(trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL)  [default: warn] logging level for
                                                                                    this command invocation

EXAMPLE

           sfdx vlk:bypasser:workflows -u someOrg
           sfdx vlk:bypasser:workflows -u someOrg -o Account,Contact
           sfdx vlk:bypasser:workflows -u someOrg -n Bypasser_API_Name__c
```

_See code: [lib/commands/vlk/bypasser/workflows.js](https://github.com/jonathanwiesel/sfdx-valkyrie/blob/v1.0.0/lib/commands/vlk/bypasser/workflows.js)_
<!-- commandsstop -->
