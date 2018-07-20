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
    protected metadataPropertyToCheck = 'validationRules';

    constructor(protected flags: any, protected ux, protected org) {
        super();
    }

    protected doesHaveBypasser(validationRule: any): boolean {
        return validationRule.errorConditionFormula.toLowerCase().indexOf(`$setup.${this.bypasserName}`) >= 0;
    }
}