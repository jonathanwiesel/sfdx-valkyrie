import { SfdxCommand } from '@salesforce/command';
import { BypasserScanner } from '../../../shared/bypasserScanner'; 

export default class BypassValidRules extends SfdxCommand {

    public static description = 'Scan for bypassers in triggers';
    public static examples = [`
sfdx vlk:bypasser:triggers -u someOrg
sfdx vlk:bypasser:triggers -u someOrg -o Account,Contact
sfdx vlk:bypasser:triggers -u someOrg -n Other_Bypasser_Name__c
    `];

    protected static requiresUsername = true;
    protected static requiresProject = false;
    protected static flagsConfig = {
        objects: {char: 'o', type: 'string', description: 'search in specified objects. Separate by comma if many'},
        name: {char: 'n', type: 'string', description: 'specify the bypasser name to search. Bypasser__c is the default'},
        factory: {char: 'f', type: 'string', description: 'specify the trigger factory to search for the bypasser'}
    };

    public async run(): Promise<any> {

        let bypasserScanner: BypasserScanner;

        if (this.flags.factory) {

            this.flags.objects = this.flags.factory;
            bypasserScanner = new BypassTriggersFactoryImpl(this.flags, this.ux, this.org);

        } else {

            bypasserScanner = new BypassTriggersImpl(this.flags, this.ux, this.org);
        }

        //TODO: check if scanning a factory or the triggers per se
        //      in case of factory, specify the factory
        //      in case of triggers per se, specify (or not) related objects

        await bypasserScanner.exec();
    }
}

class BypassTriggersImpl extends BypasserScanner {

    protected functionalName = 'triggers';
    protected metadataObj = 'ApexTrigger';

    constructor(protected flags: any, protected ux, protected org) {
        super();
    }

    protected analizeObject(objDescribe: any): void {

    }
    
    protected filterObject(objDescribe: any): boolean {
        return true;
    }

    protected doesHaveBypasser(trigger: any): boolean {
        return false;
    }
}


class BypassTriggersFactoryImpl extends BypasserScanner {

    protected functionalName = 'trigger factory';
    protected metadataObj = 'ApexClass';

    constructor(protected flags: any, protected ux, protected org) {
        super();
    }

    protected analizeObject(objDescribe: any): void {

    }

    private filterObject(objDescribe: any): boolean {
        return true;
    }

    private doesHaveBypasser(apexClass: any): boolean {
        return false;
    }
}