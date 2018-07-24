import { SfdxCommand } from '@salesforce/command';
import { BypasserScanner } from '../../../shared/bypasserScanner'; 

export default class BypassValidRules extends SfdxCommand {

    public static description = 'Scan for bypassers in validation rules';
    public static examples = [`
sfdx vlk:bypasser:validrules -u someOrg
sfdx vlk:bypasser:validrules -u someOrg -o Account,Contact
sfdx vlk:bypasser:validrules -u someOrg -n Other_Bypasser_Name__c
    `];

    protected static requiresUsername = true;
    protected static requiresProject = false;
    protected static flagsConfig = {
        objects: {char: 'o', type: 'string', description: 'search in specified objects. Separate by comma if many'},
        name: {char: 'n', type: 'string', description: 'specify the bypasser name to search. Bypasser__c is the default'}
    };

    public async run(): Promise<any> {

        let bypasserScanner = new BypassValidRulesImpl(this.flags, this.ux, this.org);

        await bypasserScanner.exec();
    }
}

class BypassValidRulesImpl extends BypasserScanner {

    protected functionalName = 'validation rules';
    protected metadataObj = 'CustomObject';

    constructor(protected flags: any, protected ux, protected org) {
        super();
    }

    protected analizeObject(objDescribe: any): void {

        if (objDescribe.validationRules) {

            let rules = objDescribe.validationRules;

            if (!(rules instanceof Array)) {
                rules = [rules];
            }

            for (let rule of rules) {

                if (this.filterObject(rule)) {

                    this.activeObjs++;

                    if (!this.doesHaveBypasser(rule)) {
                        rule.sobj = objDescribe.fullName;
                        this.invalidObjs.push(rule);
                    }
                }
            }
        }
    }

    private filterObject(validationRule: any): boolean {
        return validationRule.active === 'true' && validationRule.fullName.indexOf('__') === -1;
    }

    private doesHaveBypasser(validationRule: any): boolean {
        return validationRule.errorConditionFormula.toLowerCase().indexOf(`$setup.${this.bypasserName}`) >= 0;
    }
}