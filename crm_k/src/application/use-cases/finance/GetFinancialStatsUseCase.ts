import { IFinancialService } from '../../../domain/services';
import { FinancialStats } from '../../../domain/services/FinancialService';

export class GetFinancialStatsUseCase {
  constructor(private financialService: IFinancialService) {}

  async execute(userId?: number): Promise<FinancialStats> {
    return this.financialService.calculateStats(userId);
  }
}
