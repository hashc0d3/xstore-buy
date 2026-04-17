import { Body, Controller, Post } from "@nestjs/common";
import { CreateLeadDto } from "./dto/create-lead.dto";
import { LeadsService } from "./leads.service";

@Controller("leads")
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) {}

  @Post()
  async createLead(@Body() dto: CreateLeadDto) {
    const lead = await this.leadsService.createLead(dto);
    return { ok: true, id: lead.id };
  }
}
