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