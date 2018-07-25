import { SfdxCommand } from '@salesforce/command';
import { BypasserScanner } from '../../../shared/bypasserScanner';
import { MetadataModel } from  '../../../shared/metadataModels/base';
import { ProcessModel } from  '../../../shared/metadataModels/processModel';

export default class BypassProcess extends SfdxCommand {

    public static description = 'Scan for bypassers in processes';
    public static examples = [`
sfdx vlk:bypasser:process -u someOrg
sfdx vlk:bypasser:process -u someOrg -o Account,Contact
sfdx vlk:bypasser:process -u someOrg -n Other_Bypasser_Name__c
    `];

    protected static requiresUsername = true;
    protected static requiresProject = false;
    protected static flagsConfig = {
        objects: { char: 'o', type: 'string', description: 'search in specified objects. Separate by comma if many' },
        name: { char: 'n', type: 'string', description: 'specify the bypasser name to search. Bypasser__c is the default' }
    };

    public async run(): Promise<any> {

        let bypasserScanner = new BypassProcessImpl(this.flags, this.ux, this.org);

        await bypasserScanner.exec();
    }
}

class BypassProcessImpl extends BypasserScanner {

    protected functionalName = 'processes';
    protected metadataObj = 'FlowDefinition';
    
    private activeProcesses = [];
    private normalizedObjects = [];

    constructor(protected flags: any, protected ux, protected org) {
        super();
    }


    /**
     * Override for main orchestrator
     */
    public async exec(): Promise<void> {

        await this.init();

        if (this.flags.objects) {
            this.normalizedObjects = this.flags.objects.split(',').map(item => item.toLowerCase());
        }

        const sobjs = await this.getSobjectsToSearch();
        let objGroups = this.getObjSubgroups(sobjs);

        await this.getAndProcessDetailObjects(objGroups);

        this.totalObjs = 0;
        objGroups = this.getObjSubgroups(this.activeProcesses);
        
        this.metadataObj = 'Flow';
        await this.getAndProcessDetailObjects(objGroups);

        await this.printResult();
    }

    /**
     * Override for main object detail processor
     * @param objsDescribe - object description to be analyzed
     */
    protected analizeObject(objDescribe: any): Array<MetadataModel> {

        let models = [];

        switch (this.metadataObj) {
            case 'FlowDefinition':
                this.determineActiveProcesses(objDescribe);
                break;
            case 'Flow':
                models = ProcessModel.createModelsFromDescribe(objDescribe, this.normalizedObjects);
                break;
            default:
                break;
        }

        return models;
    } 

    /**
     * Determine if the process is active and add it to the list
     * @param objsDescribe - object description to be analized
     */
    private determineActiveProcesses(objDescribe: any): void {

        if (objDescribe.activeVersionNumber) {
            this.activeProcesses.push(`${objDescribe.fullName}-${objDescribe.activeVersionNumber}`);
        }
    }
}