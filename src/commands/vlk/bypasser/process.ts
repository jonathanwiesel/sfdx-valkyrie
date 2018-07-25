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

        let filters;
        
        if (this.flags.objects) {
            filters = this.flags.objects.split(',').map(item => item.toLowerCase());
        }

        const bypasserScanner = new BypassProcessImpl(this.ux, this.org, this.flags.name, null, filters);

        await bypasserScanner.exec();
    }
}

class BypassProcessImpl extends BypasserScanner {

    protected functionalName = 'processes';
    protected metadataObj = 'FlowDefinition';
    
    private activeProcesses = [];


    /**
     * Override for main orchestrator
     */
    public async exec(): Promise<void> {

        await this.init();

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
                models = ProcessModel.createModelsFromDescribe(objDescribe, this.relatedSObjsToFilter);
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